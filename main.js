const fs = require('fs');
const is =  require('./infusionsoft.js');
const yl = require ('./yl.js');
var dateFormat = require('dateformat');
var countries = require("i18n-iso-countries");
var request = require('request');
const dotenv = require('dotenv');

dotenv.config();

var customFieldIDs = {
    "memberid" : 11, //integer
    "level" : 6, //integer
    "pv" : 13, //decimal
    "ogv" : 15, //decimal
    "pgv" : 17, //decimal
    "autoshipday" : 19, //int
    "hasautoship" : 21, //bool (yes/no) 0 or 1
    "autoshippv" : 23, //decimal
    "autoshipstatus" : 25, //text
    "pvassistant" : 27, //bool (yes/no) 0 or 1
    "signupdate" : 29, //date
    "sponsorid" : 8, //int
    "enrollerid" : 31, //int
    "lastorderdate" : 33, //date -- yyyy-mm-dd
    "lastorderpv" : 35, //decimal
    "highestpaidrank" : 37, //int
    "previousrank" : 39, //int
    "currentrank" : 41, //int
    "rankchange": 43, //text
    "forecastpv": 45, //decimal
    "schedulepv": 47, //decimal
    "accountstatus" : 49, //text
    "accounttype" : 51, //text
    "activateddate" : 53, //date -- yyyy-mm-dd
    "yloptedout": 55, // bool
};

var key = "";

var main = function(){
    is.key(true) // Get our access token
        .then(function (returnedKey) {
            key = returnedKey; // Store the token for reuse
        })
        .then(yl.all_members) // Get all our members from the YL API
        .then(function (result) {
            var accountsToUpdate = yl.compare_to_past(result.accounts); // Select only the ones that were updated
            yl.write_data(result.accounts);
            var errors = "" + result.errors + accountsToUpdate.errors;
            return {accounts: accountsToUpdate.accounts, fullCount:result.count, updateCount: accountsToUpdate.count, errors: errors};
        }).then(function (accountsToUpdate) {
        // Convert updated YL contacts into Infusionsoft Contact JSON format
            var jsonResult = {};
            for (accountid in accountsToUpdate.accounts) {
                var thisAccount = accountsToUpdate.accounts[accountid];
                //normalize the country code
                var billingCountry = "";
                var billingRegion = "";
                if (thisAccount.maincountry.length == 2) {
                    billingCountry = countries.alpha2ToAlpha3(thisAccount.maincountry);
                } else if (thisAccount.maincountry.length == 3) {
                    billingCountry = thisAccount.maincountry;
                } else if (thisAccount.maincountry.toLowerCase().indexOf("united states") >= 0) {
                    billingCountry = "USA";
                }

                if (thisAccount.mainstate.length < 3 && billingCountry != "") {
                    billingRegion = countries.alpha3ToAlpha2(billingCountry) + "-" + thisAccount.mainstate;
                } else {
                    billingCountry = "";
                }

                var contact = {
                    "addresses": [
                        {
                            "country_code": billingCountry,
                            "field": "BILLING",
                            "line1": thisAccount.mainaddress1,
                            "line2": thisAccount.mainaddress2,
                            "locality": thisAccount.maincity,
                            //"postal_code": "string",
                            "region": billingRegion,
                            "zip_code": thisAccount.mainzip.split("-")[0],
                            "zip_four": thisAccount.mainzip.split("-")[1]
                        }
                    ],
                    "anniversary": dateFormat(thisAccount.dateactivated, "isoDateTime"),
                    //"birthday": "2018-05-22T07:26:46.999Z",
                    /*"company": {
                        "id": 0
                    },*/
                    //"contact_type": "string",
                    "custom_fields": [
                        {
                            "content": thisAccount.customerid,
                            "id": customFieldIDs.memberid
                        },
                        {
                            "content": thisAccount.level,
                            "id": customFieldIDs.level
                        },
                        {
                            "content": thisAccount.pv,
                            "id": customFieldIDs.pv
                        },
                        {
                            "content": thisAccount.ogv,
                            "id": customFieldIDs.ogv
                        },
                        {
                            "content": thisAccount.pgv,
                            "id": customFieldIDs.pgv
                        },
                        {
                            "content": thisAccount.autoship.day,
                            "id": customFieldIDs.autoshipday
                        },
                        {
                            "content": thisAccount.autoship.active ? 1 : 0,
                            "id": customFieldIDs.hasautoship
                        },
                        {
                            "content": thisAccount.autoship.pv,
                            "id": customFieldIDs.autoshippv
                        },
                        {
                            "content": thisAccount.autoship.status,
                            "id": customFieldIDs.autoshipstatus
                        },
                        {
                            "content": thisAccount.haspvassist ? 1 : 0,
                            "id": customFieldIDs.pvassistant
                        },
                        {
                            "content": dateFormat(thisAccount.signupdate, "isoDateTime"),
                            "id": customFieldIDs.signupdate
                        },
                        {
                            "content": thisAccount.sponsorid,
                            "id": customFieldIDs.sponsorid
                        },
                        {
                            "content": thisAccount.enrollerid,
                            "id": customFieldIDs.enrollerid
                        },
                        {
                            "content": dateFormat(thisAccount.lastorderdate, "isoDateTime"),
                            "id": customFieldIDs.lastorderdate
                        },
                        {
                            "content": thisAccount.lastorderpv,
                            "id": customFieldIDs.lastorderpv
                        },
                        {
                            "content": thisAccount.maxrankid,
                            "id": customFieldIDs.highestpaidrank
                        },
                        {
                            "content": thisAccount.previousrankid,
                            "id": customFieldIDs.previousrank
                        },
                        {
                            "content": thisAccount.rankid,
                            "id": customFieldIDs.currentrank
                        },
                        /*{
                            "content": thisAccount.isnewmaxrank,
                            "id": customFieldIDs.newmaxrank
                        },*/
                        {
                            "content": thisAccount.rankchange,
                            "id": customFieldIDs.rankchange
                        },
                        {
                            "content": thisAccount.futureautoshippv + thisAccount.totalpv,
                            "id": customFieldIDs.forecastpv
                        },
                        {
                            "content": thisAccount.futureautoshippv,
                            "id": customFieldIDs.schedulepv
                        },
                        {
                            "content": thisAccount.status,
                            "id": customFieldIDs.accountstatus
                        },
                        {
                            "content": thisAccount.customertype,
                            "id": customFieldIDs.accounttype
                        },
                        {
                            "content": dateFormat(thisAccount.dateactivated, "isoDateTime"),
                            "id": customFieldIDs.activateddate
                        },
                        {
                            "content": thisAccount.optedoutofemail ? 1 : 0,
                            "id": customFieldIDs.yloptedout
                        }
                    ],
                    "duplicate_option": "Email",
                    "email_addresses": [
                        {
                            "email": (thisAccount.email.indexOf("@") > 0) ? thisAccount.email : "NO_EMAIL_"+thisAccount.properName.first+thisAccount.properName.last,
                            "field": "EMAIL1"
                        }
                    ],
                    "family_name": thisAccount.properName.last,
                    /*"fax_numbers": [
                        {
                            "field": "FAX1",
                            "number": "string",
                            "type": "string"
                        }
                    ],*/
                    "given_name": thisAccount.properName.first,
                    //"job_title": "string",
                    //"lead_source_id": 0,
                    "middle_name": thisAccount.properName.middle,
                    //"notes": "string",
                    //"opt_in_reason": "string",
                    //"owner_id": 0,
                    "phone_numbers": [
                        {
                            //"extension": "string",
                            "field": "PHONE1",
                            "number": thisAccount.mainphone,
                            //"type": "string"
                        }
                    ],
                    "preferred_locale": "en_US",
                    //"preferred_name": thisAccount.properName.first,
                    "prefix": thisAccount.properName.prefix,
                    /*"social_accounts": [
                        {
                            "name": "string",
                            "type": "Facebook"
                        }
                    ],*/
                    //"source_type": "WEBFORM",
                    //"spouse_name": "string",
                    "suffix": thisAccount.properName.suffix
                    //"time_zone": "string",
                    //"website": "string"
                }
                jsonResult[accountid] = contact;
            }
            // DEBUG Write JSON to file
            fs.writeFileSync("./data/pushToIS.json", JSON.stringify(jsonResult));
            accountsToUpdate.contacts = jsonResult;
            return accountsToUpdate;
        }).then(async function (contacts) {
            //var isMappings = {};
            var promiseArray = [];
            var membersUpdated = 0;
            for (var contact in contacts.contacts) {

                // If contact is in our current mapping of known IS ID's, just update the known contact.
                // TODO: Create mappings and write them to disk
                // TODO: Load mappings
                // TODO: If there's a mapping, just update the contact (will work on email updates, or updates to contacts without an email address)

                // Otherwise, try an update/create call (Simplest, but doesn't work currently when there's an email mismatch)
                promiseArray.push(is.create_update(contacts.contacts[contact], key));
                membersUpdated++;
            }
            var returnedContacts = await Promise.all(promiseArray).catch(function (err) {
                console.log(err);
                contacts.errors = contacts.errors + err;
            });
            // TODO: Process above returnedContacts and make our mappings array for processing later
            contacts.pushCount = membersUpdated;
            return contacts;

        }).then(function (contacts) {
            // write ismappings to disk
            //if (isMappings) {
                //console.log("writing mappings to disk");

                //fs.writeFileSync("./data/account_mappings.json", JSON.stringify(isMappings));
                yl.write_data_final();
                return contacts
            //}
        }).then(function (contacts) {
            // Fire off a webhook event to keep track of if.when this script is running.
            var webhookEventName = process.env.WEBHOOK_NAME;
            var webhookURL = "https://maker.ifttt.com/trigger/" + webhookEventName + "/with/key/" + process.env.WEBHOOK_KEY;
            request.get({
                'url': webhookURL,
                'json': true,
                'body': {
                    "value1": "Members: " + contacts.fullCount,
                    "value2": "Changed: " + contacts.updateCount + "| Pushed: "+contacts.pushCount,
                    "value3": "Errors: " + contacts.errors,
                },
            }, function (err, response, body) {
                if (err) {
                    console.log('webhook get failed: ' + response.message);
                } else {
                    console.log('webhook post successful');
                }
            });
        }).catch(function (err) {
            console.log(err);
        });
}
module.exports = {
    main: main
};