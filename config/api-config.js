// Dependencies
const express = require("express");
var auth = require('../utils/authentication');

var app = express();

app.use(auth.initialize());

const session = require('express-session');
var memoryStore = new session.MemoryStore();
app.use(session({
    secret: 'genesisSecretCode',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
const morganLogger = require("morgan");
const logger = require("./logger");
const fs = require('fs');
const path = require('path');
const cors = require("cors");
var routes = require('../app/routes/routes');
var loginController = require("../app/controllers/loginController");
var vcfController = require("../app/controllers/vcfController");



var router = express.Router();

// Importing controllers for Routing
var controllers = {
    loginController: loginController,
    vcfController: vcfController
};

app.use(morganLogger('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', "extended": false }));

app.get('/', (req, res) => {
    res.send('Welcome to Genesis Server');
});
app.use('/', cors())
app.use('/', router);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes with Keyclock Enabled. For Production.
routes.setUp(router, controllers);

// Handling response for routes which are not found.
app.use(function (req, res) {
    res.status(404).json({ url: req.originalUrl + ' not found' })
});

// Global Error handler if something breaks
app.use(function (err, req, res, next) {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

// Create a Directory if File location does not exist
if (!path.join(__dirname, 'logs')) {
    fs.mkdir(path.join(__dirname, 'logs'))
}

// Exporting API Config
var ApiConfig = function () {
    this.app = app;
}
// Export models
module.exports = ApiConfig;