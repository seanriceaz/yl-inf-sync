const fs = require('fs');
const is =  require('./infusionsoft.js');
const yl = require ('./yl.js');
var dateFormat = require('dateformat');
var countries = require("i18n-iso-countries");

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

// Get and parse out updates to the young living member list
is.key()
    .then(function(returnedKey){
        key = returnedKey;
    })
    .then(yl.all_members)
    .then(function(result){
        var accountsToUpdate = yl.compare_to_past(result);
        yl.write_data(result);
        return accountsToUpdate;
    }).then(function(accountsToUpdate){
        // Convert updated YL contacts into Infusionsoft Contact JSON format
        var jsonResult = {};
        for (accountid in accountsToUpdate) {
            var thisAccount = accountsToUpdate[accountid];
            //normalize the country code
            var billingcountry = "";
            var billingregion = "";
            if (thisAccount.maincountry.length==2) {
                billingcountry = countries.alpha2ToAlpha3(thisAccount.maincountry);
            } else if (thisAccount.maincountry.length==3){
                billingcountry = thisAccount.maincountry;
            } else if (thisAccount.maincountry.toLowerCase().indexOf("united states")>=0) {
                billingcountry = "USA";
            }

            if (thisAccount.mainstate.length < 3 && billingcountry != ""){
                billingregion = countries.alpha3ToAlpha2(billingcountry)+"-"+thisAccount.mainstate;
            } else {
                billingcountry = "";
            }

            var contact = {
                "addresses": [
                    {
                        "country_code": billingcountry,
                        "field": "BILLING",
                        "line1": thisAccount.mainaddress1,
                        "line2": thisAccount.mainaddress2,
                        "locality": thisAccount.maincity,
                        //"postal_code": "string",
                        "region": billingregion,
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
                        "content": dateFormat(thisAccount.dateactivated,"isoDateTime"),
                        "id": customFieldIDs.activateddate
                    },
                    {
                        "content": thisAccount.optedoutofemail? 1 : 0,
                        "id": customFieldIDs.yloptedout
                    }
                ],
                "duplicate_option": "Email",
                "email_addresses": [
                    {
                        "email": thisAccount.email,
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
            jsonResult[accountid]=contact;
        }
        // DEBUG Write JSON to file
        fs.writeFileSync("./data/pushToIS.json", JSON.stringify(jsonResult));
        return jsonResult;
    }).then(async function(contacts){
        //Loop through contacts and push them to infusionsoft individually.
        //wait until it's done and upload another!
        var ismappings = {};
        var promiseArray = [];
        for( var contact in contacts ){

            // If contact is in our current mapping of known IS ID's, just update the known contact.
            // TODO: Create mappings and write them to disk
            // TODO: Load mappings

            // Otherwise, try an update/create call (Simplest, but doesn't work currently when there's an email mismatch)
            promiseArray.push(is.create_update(contacts[contact], key));
                //.then(function(ISContact){
                //ismappings[contact] = ISContact.id;
                //console.log("YL Contact: " +contact+ " | IS Contact: "+ISContact.id )
                //return ISContact
        }
        await Promise.all(promiseArray).catch(function(err) {
            console.log(err);
            return false;
        });
        //
        return ismappings;
    }).then(function(ismappings){
        // write ismappings to disk
        if(ismappings){
            console.log("writing mappings to disk");

            fs.writeFileSync("./data/account_mappings.json", JSON.stringify(ismappings));
            //yl.write_data_final();
        }
    })
    .catch(function(err){
        console.log(err);
    });




// Write the updated account listing to disk for comparison later
