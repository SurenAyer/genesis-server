var logger = require("./config/logger");
var Apis = require("./config/api-config");

var apis = new Apis();

var host = "localhost";
var port = 3000;

apis.app.listen(port, () => {
  logger.info(`Server Up & Running at http://${host}:${port}`);
})