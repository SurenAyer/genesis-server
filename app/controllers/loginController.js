const loginService = require('../services/loginService');
var Response = require("../util/response");
var log4js = require('log4js');
var logger = log4js.getLogger('Network Controller');

const loginController = {
    login: login
};
//Normal Login
function login(req, res) {
    var response = new Response();
    var userDetails = req.body;
    loginService.login(userDetails).then(function (token) {
        response.result.token = token;
        response.status.statusCode = '200';
        response.status.message = 'Logged in Successfully!! ';
        res.status(200).json(response);
    }).catch(function (err) {
        console.log("Got Error", err);
        if (err.code == 401) {
            response.status.code = 401;
            response.status.message = err;
            res.status(response.status.code).json(response);
        } else {
            response.status.code = 500;
            response.status.message = err;
            res.status(response.status.code).json(response);
        }
    })
}
module.exports = loginController;