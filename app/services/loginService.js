var logger = require("../../config/logger");
var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var jwtConfig = require("../../config/jwtConfig");
const axios = require('axios');
const Bcrypt = require("bcryptjs");
const { input } = require("../../config/logger");

const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');


var loginService = {
    login: login
}

function login(userDetails) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log("User Details", userDetails);
            if (userDetails.email == "genesis@gmail.com" && userDetails.password == "Genesis123") {
                var payload = {
                    email: userDetails.email,
                    role: userDetails.role
                };
                console.log("Payload", payload);

                var token = jwt.sign(payload, jwtConfig.jwtSecret, {
                    expiresIn: jwtConfig.expireTime
                });
                console.log("Token", token);
                resolve(token);
                //resolve(response.data)
            }
            else
                logger.error("Error", "Invalid Login Credentials");
            reject("Invalid Login Credentials");
        } catch (err) {
            console.log("Got Error", err);
            reject(err.message);
        }

    });

}




module.exports = loginService;
