const fs = require('fs');
const infusionsoft =  require('infusionsoft');
const yl = require ('yl');
var request = require('request');

//Here's how this app will flow...

// Get new infusionsoft API/refresh keys using previously stored refresh key
var tokens = infusionsoft.getTokens();
var tokens = {
        key: "",
        refresh: ""
    };
// store refresh token for next time
fs.writeFileSync("./REFRESH", tokens.refresh);

// Get parse out updates to the young living member list
let allAccounts = yl.all_members();
let accountsToUpdate = yl.compare_to_past(accountsToUpdate);

// Push those updates to Infusionsoft.
for (accountid in accountsToUpdate) {
    var contact = {
        "addresses": [
            {
                "country_code": "string",
                "field": "BILLING",
                "line1": "string",
                "line2": "string",
                "locality": "string",
                "postal_code": "string",
                "region": "string",
                "zip_code": "string",
                "zip_four": "string"
            }
        ],
        "anniversary": "2018-05-22T07:26:46.999Z",
        "birthday": "2018-05-22T07:26:46.999Z",
        "company": {
            "id": 0
        },
        "contact_type": "string",
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