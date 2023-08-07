global.TextEncoder = require("util").TextEncoder; // due to bug in mongoose
global.TextDecoder = require("util").TextDecoder;
const mongoose = require("mongoose");
const config = require("config");
const winston = require("winston");

module.exports = function() {
  mongoose
    .connect(
      config.MongoDBUrl,
      { useNewUrlParser: true }
    )
    .then(() => winston.info(`Connected to MongoDB...`));
};
