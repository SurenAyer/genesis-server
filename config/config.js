var fs = require('fs');
var logger = require('./logger');
var environment = 'PROD';


var properties = {
    LOCAL: {
        app: {
            port: 3000
        },
        db: {
            username: "****",
            password: "********",
            host: "localhost",
            port: 3000,
            dbName: 'genesisDB'
        },
        logs: {
            location: 'logs'
        },
        swagger: {
            protocol: 'http',
            host: 'localhost',
            port: 3000
        }
    },
    //Running services on VM and connecting to DB on same VM
    PROD: {
        app: {
            port: 3000
        },
        db: {
            host: '127.0.0.1',
            port: 3000,
            username: process.env.MONGO_USER,
            password: process.env.MONGO_PASS,
            dbName: 'genesisDB'
        },
        logs: {
            location: 'logs'
        },
        swagger: {
            protocol: 'http',
            host: 'localhost',
            port: 3000
        },
    }
};

var getProperties = function () {
    return properties[environment];
}

var setEnvironment = function (newEnvironment) {
    if (properties[newEnvironment]) {
        environment = newEnvironment;
    }
    logger.info("Setting up properties for ", environment, " environment");
    //changeSwaggerConfigurations();
};
var getEnvironment = function () {
    return environment
};

module.exports = {
    properties: getProperties,
    setEnvironment: setEnvironment,
    getEnvironment: getEnvironment
};
