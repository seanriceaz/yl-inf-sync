//Service stuff goes here!
var dotenv = require('dotenv');
const fs = require('fs');
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
var handle_all_members = function (err, data) {
  if (data.pagination.next) {
    data.pagination.next(handle_all_members);
  }
  fs.writeFile('output.log',JSON.stringify(data));
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
