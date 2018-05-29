const fs = require('fs');
const infusionsoft =  require('infusionsoft');
const yl = require ('yl');
var request = require('request');
var dateFormat = require('dateformat');

//Here's how this app will flow...

// Get new infusionsoft API/refresh keys using previously stored refresh key
var tokens = infusionsoft.getTokens();
var tokens = {
        key: "",
        refresh: ""
    };

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
};

// store refresh token for next time
fs.writeFileSync("./REFRESH", tokens.refresh);

// Get and parse out updates to the young living member list
let allAccounts = yl.all_members();
let accountsToUpdate = yl.compare_to_past(accountsToUpdate);

// Push those updates to Infusionsoft.
for (accountid in accountsToUpdate) {
    var thisAccount = accountsToUpdate[accountid];
    var contact = {
        "addresses": [
            {
                "country_code": thisAccount.maincountry,
                "field": "BILLING",
                "line1": thisAccount.mainaddress1,
                "line2": thisAccount.mainaddress2,
                "locality": thisAccount.maincity,
                //"postal_code": "string",
                "region": thisAccount.mainstate,
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
                "content": {},
                "id": 0
            }
        ],
        "duplicate_option": "Email",
        "email_addresses": [
            {
                "email": "string",
                "field": "EMAIL1"
            }
        ],
        "family_name": "string",
        "fax_numbers": [
            {
                "field": "FAX1",
                "number": "string",
                "type": "string"
            }
        ],
        "given_name": "string",
        "job_title": "string",
        "lead_source_id": 0,
        "middle_name": "string",
        "notes": "string",
        "opt_in_reason": "string",
        "owner_id": 0,
        "phone_numbers": [
            {
                "extension": "string",
                "field": "PHONE1",
                "number": "string",
                "type": "string"
            }
        ],
        "preferred_locale": "en_US",
        "preferred_name": "string",
        "prefix": "string",
        "social_accounts": [
            {
                "name": "string",
                "type": "Facebook"
            }
        ],
        "source_type": "WEBFORM",
        "spouse_name": "string",
        "suffix": "string",
        "time_zone": "string",
        "website": "string"
    }
    //wait until it's done and upload another!
    try {
        request.put({
            'url': 'https://api.infusionsoft.com/crm/rest/v1/contacts/',
            json: true,
            'auth':{
                'bearer': tokens.key
            },
        })
    } catch(e){
        console.log(e);
    }
}

// Write the updated account listing to disk for comparison later
yl.write_data(allAccounts);