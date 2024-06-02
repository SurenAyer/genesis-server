var winston = require('winston');
var fs = require('fs');
var path = require('path');
var logDir = 'logs'

winston.emitErrs = false;

function formatter(args) {
    var dataTimeComponent = new Date();
    var dateTimeComponents = new Date().toLocaleTimeString('en-us').split(',');
    var logMessage = dataTimeComponent + ' - ' + args.level + ': ' + args.message;
    return logMessage;
}

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'debug',
            filename: 'logs/genesis-services.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: true,
            formatter: formatter
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true,
            timestamp: true,
            label: 'genensis-services',
            humanReadableUnhandledException: true
        })
    ],
    exitOnError: false
});

module.exports = logger;

module.exports.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};