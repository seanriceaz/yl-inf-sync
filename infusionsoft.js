var is_login_options = {
    is_client: process.env.IS_CLIENT,
    is_secret: process.env.IS_SECRET,
    is_key: process.env.IS_KEY  //This won't work long term. need to build in the refresh mechanism...
}


function pushToInfusionsoft(member){
    let opts = {
        'limit': 1, // Number | Sets a total of items to return
        'offset': 1, // Number | Sets a beginning range of items to return
        'customFields': {
            'member_id': member.customerid
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