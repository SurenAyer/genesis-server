var passport = require("passport");
var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;
var jwtConfig = require("../config/jwtConfig.js");

var params = {
    secretOrKey: jwtConfig.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};


var log4js = require('log4js');
var logger = log4js.getLogger('Authenticate User');
logger.setLevel('DEBUG');

var loginService = require('../app/services/loginService');

function initialize() {
    var newStrategy = new Strategy(params, function (payload, done) {
        //loginService.findUser(payload).then((user) => {
        return done(null, payload)
        //}).catch((err) => {
        //  return done(null, false)
        //})
    });
    passport.use(newStrategy);
    return passport.initialize();
}

function authenticate() {
    return passport.authenticate("jwt", jwtConfig.jwtSession);
}

module.exports = {
    initialize: initialize,
    authenticate: authenticate
}

