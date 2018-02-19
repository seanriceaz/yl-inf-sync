//Service stuff goes here!
var dotenv = require('dotenv');
const fs = require('fs');
var isequal = require('is-equal-shallow');
dotenv.config();

var json2csv = require('json2csv');

var fields = ['field1', 'field2', 'field3'];

var yl = require('youngliving-node').youngliving();


var login_options = {
  password: process.env.YL_PASSWORD,
  member_id: process.env.YL_MEMBER_ID
}

// Store credentials
yl.use(login_options);

var period = yl.get_period(); // or pass optional date parameter for a different period.
var per_page = 200, page_number = 1;

var build_array_keys = function (obj){
  //Loops through an array of members and creates keys from each element.
  var newObj = [];
  for (el in obj){
    newObj[el.customerid]=el;
  }
  return (newObj);
}

var accounts = [];
var updatedAccounts = [];
var handle_all_members = function (err, data) {
  //This function gets all the YL members returned from the call and flattens them to one javascript object.
  if( !err ){
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

var compare_to_past = function ( freshData ) {
  //This function looks at the new data and compares it to the past data. Ultimately, it creates am array or member ID's that have changed.
  //load data to a js object
  oldData = build_array_keys(JSON.parse(fs.readFileSync('data/yl-old', 'utf8')));
  //loop through fresh and see if there's anything new
  for (member in freshData){
    if (isequal(member,oldData[member.customerid])){
      //do nothing
    } else {
      updatedAccounts.push(member.customerid);
    }
  }
}

var write_data = function ( freshData ){
  //This is the last thing we should do
  fs.writeFile('data/yl-old.json',JSON.stringify(freshData));
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
