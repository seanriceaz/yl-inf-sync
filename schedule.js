var main = require('./main.js');
var cron = require('node-cron');

cron.schedule('0 */6 * * *', function(){
    main.main();
});