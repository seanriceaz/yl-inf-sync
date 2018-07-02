# yl-inf-sync

A Node.js script to sync a Young Living account with an Infusionsoft one.

## Note

There is a bit of hard-coded stuff in here for my specific infusionsoft app. If you're interested in using this, you will need to modify it to you needs. Specifically you'll need to adjust the custom field ID's in `main.js` to match your Infusionsoft setup.

## Getting started

I assume you have an account with [Young Living](http://wwwyoungliving.com), an account with [Infusionsoft](http://www.infusionsoft.com), and an [Infusionsoft developer account](keys.developer.infusionsoft.com) with an app set up for this. I also assume you've created the necessary custom fields in your Infusionsoft account to sync with your Young Living ones. See my example in the code for a list.

## Steps to sync once

1. Clone or fork this repo
2. Modify it to your needs
3. Create a `.env` file to store your access credentials for Young Living and Infusionsoft (see the example)
4. Create a file called `REFRESH` (no extension) and add your Infusionsoft refresh token into it as JSON: `{"refresh_token":"xxxxxxxxxxx21345aadsfaxx"}`
5. `$ npm install`
6. `$ node index.js`

## Steps to create a daemon that syncs regularly

By default, this syncs every 6 hours starting at midnight derver time. You can adjust that in `schedule.js`

1. Follow all the steps for syncing once. This will let you test to see if everything works properly and make adjustments.
2. Install [PM2](https://pm2.io/doc/en/runtime/quick-start/): `$ npm install pm2 -g`
3. Setup the daemon to run forever: `$ pm2 start schedule.js --name inf_yl_sync`
4. Setup the daemon to restart on server reboot: `pm2 startup` (follow the instructions it gives you)

## Disclaimer

This code seems to work for me and my particular connection. It may not work for you. I've provided it as a way to help you get started with your own solution. In other words, it's for educational purposes only. As such, I'm not responsible for how you use it and any data loss or other damages you may incur.

Code responsibly!
