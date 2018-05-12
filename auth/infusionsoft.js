var passport 		= require('passport'),
    InfusionsoftStrategy  = require('passport-infusionsoft').Strategy;

var env				= process.env.NODE_ENV || "development",

passport.use(new InfusionsoftStrategy({
        clientID: process.env.IS_CLIENT,
        clientSecret: process.env.IS_SECRET,
        callbackURL: process.env.SERVER_ADDRESS + ":" + process.env.SERVER_PORT + "/auth/infusionsoft/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        var tokens = {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
        return done(null, tokens);
    }
));

passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
});

passport.deserializeUser(function(user, done) {
    done(null, JSON.parse(user));
});

module.exports = passport;