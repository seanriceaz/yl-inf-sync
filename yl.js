const dotenv = require('dotenv');
const fs = require('fs');
const fastEquals = require('fast-equals');
const parseFullName = require('parse-full-name').parseFullName;

dotenv.config();

var yl = require('youngliving-node').youngliving();

var build_array_keys = function (obj) {
    //Loops through an array of members and creates keys from each element.
    console.log("Building a keyed object for " + obj.length + " members...");
    var newObj = {};
    for (var el in obj) {
        var key = obj[el].customerid;
        newObj[key] = obj[el];
    }
    return (newObj);
}

var format_names = function(obj) {
    console.log("Formatting names...");
    for (var customerid in obj) {
        if (obj.hasOwnProperty(customerid)) {
            obj[customerid].properName = parseFullName(obj[customerid].name.replace(/\s([A-Z])\s/, ' $1. '));
        }
    }
    return obj;
}

async function get_all_members(){
    var accounts = [];
    var errors = "";
    console.log('getting members from YL...');
    try {
        var page_number = 1;
        let data = await get_member_page(page_number);
        while (data.pagination.currentpage <= data.pagination.totalpages) {
            accounts = accounts.concat(data.accounts);
            console.log("page: " + page_number + " | total accounts fetched: " + accounts.length + " | OK");
            page_number++;
            data = await get_member_page(page_number);
        }
    } catch (e){
        errors = errors + e;
    };
    return {accounts: format_names(build_array_keys(accounts)), count: accounts.length, errors: errors}
}

function get_member_page(page){
    return new Promise(function(resolve, reject){

        dotenv.config();

        var yl_login_options = {
            password: process.env.YL_PASSWORD,
            member_id: process.env.YL_MEMBER_ID,
        }

        // Store credentials
        yl.use(yl_login_options);

        var period = yl.get_period(); // or pass optional date parameter for a different period.
        var per_page = 200;

        yl.all_members(period, per_page, page, function(err, data){
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        })
    });
}

var compare_to_past = function (freshData) {
    //This function looks at the new data and compares it to the past data. Ultimately, it creates an array of member ID's that have changed.
    //load data to a js object
    try {
        var oldData = {};
        if (fs.existsSync('yl-old.json')){
            oldData = JSON.parse(fs.readFileSync('yl-old.json', 'utf8'));
        }
        
        //loop through fresh and see if there's anything new
        var updatedAccounts = {};
        var count = 0;
        for (var member in freshData) {
            if (fastEquals.deepEqual(freshData[member], oldData[freshData[member].customerid])) {
                //do nothing
            } else {
                count++;
                updatedAccounts[member] = freshData[member];
                console.log("Member info changed: " + freshData[member].properName.first + " " +freshData[member].properName.last +" - " + freshData[member].customerid);
            }
        }
        console.log(count + " Members updated");
        return {accounts: updatedAccounts, count: count, errors: ""};
    } catch (e) {
        console.log(e);
        return {accounts: freshData, count: -1, errors: e};
    }
}

function write_data (freshData) {
    console.log("Writing updated accounts temporarily to disk...");
    fs.writeFileSync('yl-temp.json', JSON.stringify(freshData));
}
function write_data_final (freshData) {
    console.log("Storing updated accounts for reference...");
    fs.copyFileSync('yl-temp.json', 'yl-old.json');
}

module.exports = {
    all_members: get_all_members,
    compare_to_past : compare_to_past,
    write_data: write_data,
    write_data_final: write_data_final
};