const winston = require("winston");
const express = require("express");
const app = express();

require("./startup/logging")();
require("./startup/cors")(app);
require("./startup/routes")(app);
require("./startup/database")();

// PORT is an environment variable which will set the port for this to listen to.
// process is global
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`listening on port ${port}...`)
);

module.exports = server;
