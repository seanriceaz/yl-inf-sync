var request = require('request');
throttledRequest = require('throttled-request')(request);
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

throttledRequest.configure({
    requests: 15,
    milliseconds: 1000
});

var keys = {
    client: process.env.IS_CLIENT,
    secret: process.env.IS_SECRET,
    key: ""
}

function fetch_key(){
    //if we don't have a key for this session, let's get a new one
    return new Promise(function(resolve, reject){
        if (keys.key != ""){
            resolve(keys.key);
        } else {
            //retrieve a key!
            // store refresh token for next time
            var refresh_token = fs.readFileSync('./REFRESH', 'utf8');
            request({
                method:"POST",
                url: "https://api.infusionsoft.com/token",
                form:{refresh_token: refresh_token,
                grant_type: "refresh_token"},
                headers: {
                    "authorization":'Basic ' + Buffer.from(keys.client + ':' + keys.secret).toString('base64')
                }
            }, function(err, response, body) {
                if (err) {
                    reject(err);
                } else if (response.statusCode >=400) {
                    reject(Error("Couldn't get key! Status Code:" + response.statusCode + " | Message: "+response.body.message));
                } else {
                    //body example: {"access_token":"xxxxxx","token_type":"bearer","expires_in":86400,"refresh_token":"xxxxxxxx","scope":"full|xx123.infusionsoft.com"}
                    var tempToken = JSON.parse(body);
                    keys.key = tempToken.access_token;
                    console.log("keys.key: "+ keys.key+" | access: "+ tempToken.access_token+" | refresh: " + tempToken.refresh_token);
                    console.log(body);
                    fs.writeFileSync( "./REFRESH", tempToken.refresh_token);
                    resolve(tempToken.access_token);
                }

            })
        }
    });
}

async function create_update(member, key){
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

module.exports = {
    create_update: create_update,
    key: fetch_key
};