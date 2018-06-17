var request = require('request');
throttledRequest = require('throttled-request')(request);
const dotenv = require('dotenv');
dotenv.config();

throttledRequest.configure({
    requests: 5,
    milliseconds: 1000
});

var keys = {
    client: process.env.IS_CLIENT,
    secret: process.env.IS_SECRET,
    key: process.env.IS_KEY // TODO: create an automated way to get the key using the refresh token!
}

function fetch_key(){
    //if we don't have a key for this session, let's get a new one
    return new Promise(function(resolve, reject){
        if (keys.key){
            resolve(keys.key);
        } else {
            //retrieve a key!
            // store refresh token for next time
            //fs.writeFileSync( "./REFRESH", tokens.refresh);
            var err = Error("No Key, and we haven't written the way to get a new one");
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        }
    });
}

async function create_update(member, opts){
    let key = await fetch_key();
    return new Promise(function(resolve, reject){
        throttledRequest({
            method:'PUT',
            url: 'https://api.infusionsoft.com/crm/rest/v1/contacts/',
            json: true,
            auth:{
                'bearer': key
            },
            body: member
        }, function(err, response, body){
            var contact = body;
            if (err) {
                reject(err);
            } else if (response.statusCode >= 400){
                reject(Error('Infusionsoft API error! Status Code:' + response.statusCode + " | Message: "+response.body.message));
            } else {
                resolve(contact);
            }
        });
    });
}

async function getID(member){
    let opts = {
        'limit': 1, // Number | Sets a total of items to return
        'offset': 1, // Number | Sets a beginning range of items to return
        'customFields': {
            'member_id': member
        },
        'optional_properties': ['custom_fields']
    };

    /*
    apiInstance.listContactsUsingGET(opts, (error, data, response) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Found the member!: ' + data);
        if (data.length < 1){
          //Just push new
        } else {
          var inf_member_id = data[0].id;
          //push an update


        }
      }

    });
    */
    // This is where to push updates to infusionsoft...
    // info here: https://github.com/infusionsoft/infusionsoft-sdk-nodejs/blob/master/docs/ContactApi.md#updateContactUsingPATCH
    // and here: https://github.com/infusionsoft/infusionsoft-sdk-nodejs/blob/master/docs/ContactApi.md#updateContactUsingPATCH
    /* var opts = {
      'since': "since_example", // {String} Date to start searching from ex. `2017-01-01T22:17:59.039Z`
      'until': "until_example", // {String} Date to search to ex. `2017-01-01T22:17:59.039Z`
      'limit': 56, // {Number} Sets a total of items to return
      'offset': 56 // {Number} Sets a beginning range of items to return
    };

    var callback = function(error, data, response) {
      if (error) {
        console.error(error);
      } else {
        console.log('API called successfully. Returned data: ' + data);
      }
    };
    api.appointmentsUsingGET(opts, callback);
    */
}

module.exports = {
    create_update: create_update,
    key: fetch_key
};