const config = require("config");
const winston = require("winston");
const WinstonMongoDB = require("winston-mongodb");
require("express-async-errors"); // sends errors in routes to the handler in middleware/error

module.exports = function() {
  // handler for uncaught exceptions
  process.on("uncaughtException", ex => {
    console.log("WE GOT AN UNCAUGHT EXCEPTION");
    console.log(ex);
    winston.error(ex.message, { meta: ex });
    process.exit(1);
  });

  // this catches uncaught promise rejections
  process.on("unhandledRejection", ex => {
    throw ex; // this causes an uncaught exception, and winston will log this
  });

  // create the loggers for console, file and mongo
  // this new version of winston seems to handle uncaught exceptions as well without anything new
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console()
      //            new winston.transports.File({ filename: 'combined.log' }),
      //            new winston.transports.MongoDB({ db: config.MongoDBUrl })
    ],
    meta: true
  });

  winston.add(logger);
};
