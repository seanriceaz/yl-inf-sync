const dotenv = require('dotenv');
const fs = require('fs');
const fastEquals = require('fast-equals');
const parseFullName = require('parse-full-name').parseFullName;
const json2csv = require('json2csv');

dotenv.config();

var yl = require('youngliving-node').youngliving();


var yl_login_options = {
    password: process.env.YL_PASSWORD,
    member_id: process.env.YL_MEMBER_ID,
}

// Store credentials
yl.use(yl_login_options);

//Set up limits

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

var format_names = function(obj) {
    console.log("Formatting names...");
    for (var customerid in obj) {
        if (obj.hasOwnProperty(customerid)) {
            obj[customerid].properName = parseFullName(obj[customerid].name);
        }
    }
    return obj;
}

async function get_all_members(){
    var accounts = [];
    let data = await yl.all_members(period, per_page, page_number);
    while (data) {
        accounts = accounts.concat(data.accounts);
        data = await data.pagination.next();
    }
    return format_names(build_array_keys(accounts));
}

/*
var handle_all_members = function (err, data) {
    //This function gets all the YL members returned from the call and flattens them to one javascript object.
    if (data) {
        accounts = accounts.concat(data.accounts);
        if (data.pagination.next) {
            //If we're not at the end of the list yet, recurse
            data.pagination.next(handle_all_members);
        } else {
            //We've reached the end of the list.
            // Let's format and normalize our array
            accounts = format_names(build_array_keys(accounts));
            return accounts;
        }
    } else {
        console.log(err)
        return null;
    }
}*/

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
        var updatedAccounts = [];
        for (member in freshData) {
            if (fastEquals.deepEqual(freshData[member], oldData[freshData[member].customerid])) {
                //do nothing
            } else {
                updatedAccounts.push(freshData[member].customerid);
                console.log("Member info changed: " + freshData[member].name + " - " + freshData[member].customerid);
            }
        }
        return updatedAccounts;
    } else {
        return freshData;
    }
}

async function write_data (freshData) {
    //This is the last thing we should do
    fs.writeFile('data/yl-old.json', JSON.stringify(freshData));
}

module.exports = {
    all_members: get_all_members,
    compare_to_past : compare_to_past,
    write_data: write_data
};

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