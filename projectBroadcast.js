var request = require('request');
throttledRequest = require('throttled-request')(request);
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

throttledRequest.configure({
    requests: 10,
    milliseconds: 1000
});

var keys = {
    key: process.env.PB_KEY
}

async function create_update(member, key){
    return new Promise(function(resolve, reject){
        throttledRequest({ //Todo: build transforms for project broadcast in here.
            method:'PUT',
            url: 'https://api.infusionsoft.com/crm/rest/v1/contacts/',
            json: true,
            auth:{
                'bearer': key
            },
            body: {
                "name": member.whateverwhatever,
                "phone": member.phone,
            },
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

module.exports = {
    create_update: create_update,
    key: keys.key
};