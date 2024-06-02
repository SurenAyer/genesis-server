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

function newLogin(userDetails) {
    return new Promise(async function (resolve, reject) {
        try {


            var queryInput = {
                // "orgName": userDetails.orgName.toString(),
                //"mid": userDetails.mid.toString()
            }

            let fcn = 'findAllUsers'
            var orgName = userDetails.orgName.toLowerCase();
            var orgDomain = orgName + ".com"

            queryService.query(orgName, orgDomain, fcn, queryInput)
                .then(queryResult => {
                    //If User found
                    var found = false;

                    //  console.log("Query Result", queryResult);
                    var role;
                    queryResult.result.forEach(user => {
                        //     console.log("User", user);
                        let orgName = cryptr.decrypt(user.orgName)
                        let mid = cryptr.decrypt(user.mid)
                        let password = cryptr.decrypt(user.password)
                        if (orgName == userDetails.orgName && mid == userDetails.mid && password != userDetails.password)
                            throw new Error("Invalid Password");
                        else if (orgName == userDetails.orgName && mid == userDetails.mid && password == userDetails.password) {
                            found = true
                            role = cryptr.decrypt(user.role);
                        }
                    });
                    if (found) {

                        var payload = {
                            orgName: userDetails.orgName,
                            mid: userDetails.mid,
                            role: role
                        };
                        var token = jwt.sign(payload, jwtConfig.jwtSecret, {
                            expiresIn: jwtConfig.expireTime
                        });
                        resolve(token);
                    }
                    //User Not Found in Ledger
                    else {
                        console.log("USER NOT FOUND IN LEDGER");
                        axios.post('http://137.116.132.166:52050/user/login', userDetails)
                            .then(function (response) {
                                var user = response.data;
                                //   console.log("User", user);
                                //Store User Info in Ledger
                                fcn = 'addUser'
                                var inputData = {
                                    orgName: user.orgName,
                                    mid: user.mid,
                                    role: user.role,
                                    password: user.password
                                }
                                invokeService.invoke(orgName, orgDomain, fcn, inputData)
                                    .then(async function (chaincodeoutput) {
                                        //    console.log("chaincode output", chaincodeoutput);

                                        //SEND TOKEN
                                        var payload = {
                                            orgName: userDetails.orgName,
                                            mid: userDetails.mid,
                                            role: cryptr.decrypt(user.role)
                                        };
                                        //   console.log("Payload", payload);

                                        var token = jwt.sign(payload, jwtConfig.jwtSecret, {
                                            expiresIn: jwtConfig.expireTime
                                        });
                                        resolve(token);

                                    }).catch(function (err) {
                                        console.log("Got Error", err);
                                        reject(err.message);
                                    });



                                // resolve(response.data)
                            })
                            .catch(error => {
                                if (error.message == "connect ECONNREFUSED 137.116.132.166:52050")
                                    reject("Unable to verify at the moment!! Please try again later")
                                else
                                    reject("Invalid Login Credentials");

                            });

                    }



                }).catch(function (err) {
                    logger.error("Could not add Insurance Info details to blockchain", err.stack);

                    reject(err.message);

                });


        } catch (err) {
            reject(error.message);

        }
    });
}





module.exports = loginService;