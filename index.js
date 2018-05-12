//Service stuff goes here!
var		env				= process.env.NODE_ENV || "development",
    config			= require('./config')[env],
    http			= require('http'),
    compression 	= require('compression'),
    cookieSession	= require('cookie-session'),
    bodyParser		= require('body-parser'),
    passport		= require('passport'),
    express			= require('express');

require('./auth/infusionsoft');

const dotenv = require('dotenv');
const fs = require('fs');
const fastEquals = require('fast-equals');

dotenv.config();

const InfusionsoftRestApi = require('infusionsoft_rest_api');

let apiInstance = new InfusionsoftRestApi.ContactApi();

const json2csv = require('json2csv');

var fields = ['field1', 'field2', 'field3'];

var yl = require('youngliving-node').youngliving();


var login_options = {
    password: process.env.YL_PASSWORD,
    member_id: process.env.YL_MEMBER_ID
}

// Store credentials
yl.use(login_options);

var period = yl.get_period(); // or pass optional date parameter for a different period.
var per_page = 200,
    page_number = 1;

var build_array_keys = function (obj) {
    //Loops through an array of members and creates keys from each element.
    console.log("Building array keys...")
    var newObj = [];
    for (el in obj) {
        newObj[obj[el].customerid] = obj[el];
    }
    return (newObj);
}

var accounts = [];
var updatedAccounts = [];
var handle_all_members = function (err, data) {
    //This function gets all the YL members returned from the call and flattens them to one javascript object.
    if (data) {
        accounts = accounts.concat(data.accounts);
        if (data.pagination.next) {
            //If we're not at the end of the list yet, recurse
            data.pagination.next(handle_all_members);
        } else {
            //We've reached the end of the list!
            //Let's kick this out to a separate function.
            compare_to_past(build_array_keys(accounts));
        }
    } else {
        console.log(err);
    }
}

var compare_to_past = function (freshData) {
    //This function looks at the new data and compares it to the past data. Ultimately, it creates an array of member ID's that have changed.
    //load data to a js object
    if (fs.existsSync('data/yl-old.json')) {
        try {
            oldData = build_array_keys(JSON.parse(fs.readFileSync('data/yl-old.json', 'utf8')));
        } catch (e) {
            console.log(e);
        }
        //loop through fresh and see if there's anything new
        for (member in freshData) {
            if (fastEquals.deepEqual(freshData[member], oldData[freshData[member].customerid])) {
                //do nothing
            } else {
                updatedAccounts.push(freshData[member].customerid);
                console.log("Member info changed: " + freshData[member].name + " - " + freshData[member].customerid);
                pushToInfusionsoft(freshData[member]);
            }
        }
        //Push updates to Infusionsoft (Don't forget to split the names!)

    } else {
        //Everything is new.
        //Push everything to Infusionsoft (Don't forget to split the names!)
        for(member in freshData) {
          pushToInfusionsoft(freshData[member]);
        }
    }
    //Write everything to our file.
    //write_data(freshData);

}

var write_data = function (freshData) {
    //This is the last thing we should do
    fs.writeFile('data/yl-old.json', JSON.stringify(freshData));
}

var split_format_name = function (name) {
    var firstName = "",
        lastName = "",
        nameArray = name.split(' ');
    //Fix capitalization
    for (i in nameArray) {
        nameArray[i] = nameArray[i].charAt(0).toUpperCase() + nameArray[i].substr(1).toLowerCase();
    }
    if (name.indexOf(',') > 0) {
        //We've got a reverse name. Easy peasy!
        var stopAdding = false;
        for (i = 0; i < nameArray.length; i++) {
            if (!stopAdding) {
                lastName = lastName + nameArray[i];
            }
            if (nameArray[i].indexOf(',') > 0) {
                stopAdding = true;
                lastName.replace(',', "");
                firstName = nameArray[i + 1];
            } else {
                lastName = lastName + " ";
            }
        }
    } else if (nameArray.length > 2) {
        //determine if we need to figure out a two-word last name
        var secondToLast = nameArray[nameArray.length - 2];
        if (secondToLast == "Van" || secondToLast == "Von" || secondToLast == "Del") {
            lastName = nameArray[nameArray.length - 2] + " " + nameArray[nameArray.length - 1];
        } else if (secondToLast == "Der" && nameArray[nameArray.length - 3] == "Van") {
            lastName = nameArray[nameArray.length - 3] + " " + nameArray[nameArray.length - 2] + " " + nameArray[nameArray.length - 1];
        } else {
            lastName = nameArray[nameArray.length - 1];
        }
        firstName = nameArray[0];
    } else {
        lastName = nameArray[nameArray.length - 1];
        irstName = nameArray[0];
    }
    return {
        first: firstName,
        last: lastName
    }
}

var pushToInfusionsoft(member){
  let opts = {
    'limit': 1, // Number | Sets a total of items to return
    'offset': 1, // Number | Sets a beginning range of items to return
    'customFields': {
      'member_id': member.customerid
    },
    'optional_properties': ['custom_fields']


  };

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

yl.all_members(period, per_page, page_number, handle_all_members);

//fs.writeFile('output.log',)

/*

try {
  var result = json2csv({ data: myData, fields: fields });
  console.log(result);
} catch (err) {
  // Errors are thrown for bad options, or if the data is empty and no fields are provided.
  // Be sure to provide fields if it is possible that your data array will be empty.
  console.error(err);
}
*/


var app = express();
app.use(compression());
app.use(cookieSession({ keys: config.cookieSessionKeys }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', express.static(__dirname + '/static'));

app.use('/api', require('./routes'));

app.get('/auth/infusionsoft', passport.authenticate('Infusionsoft', { scope: ['full'] }));
app.get('/auth/infusionsoft/callback', passport.authenticate('Infusionsoft', { failureRedirect: '/' }),
    function(req, res){
        res.redirect('/');
    }
);

http.createServer(app).listen(config.port);
console.log("Server starting on "+config.port);