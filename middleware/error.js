const winston = require("winston");

module.exports = function(error, request, response, next) {
  // log the exception

  // winston is broken at the moment and can't log to mongo
  //  todo: log only to file
  //    winston.error(error.message, { meta: error });
  console.log(error);
  response.status(500).send("Something failed!");
};
