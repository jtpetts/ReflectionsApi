const express = require("express");
const maps = require("../routes/MapsRoute");
const hotSpots = require("../routes/HotSpotsRoute");
const users = require("../routes/UsersRoute");
const auth = require("../routes/AuthRoute");
const errorHandler = require("../middleware/error");

module.exports = function(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  app.use("/api/maps", maps);
  app.use("/api/maps/:mapId/hotspots", hotSpots);
  app.use("/api/users", users);
  app.use("/api/auth", auth);

  app.use(errorHandler);
};
