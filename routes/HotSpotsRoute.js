const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const express = require("express");
const router = express.Router({ mergeParams: true }); // to get the mapId param from earlier in the route
const { MapModel, validateHotSpot } = require("../models/MapModel");

//__________________________________________________________________________________________________________
router.get(
  "/:hotSpotId",
  asyncMiddleware(async (request, response) => {
    // get the map with all hotspots
    const map = await MapModel.findById(request.params.mapId);
    if (map == null)
      return response
        .status(404)
        .send("The map with the given id was not found");

    const hotSpot = map.hotSpots.id(request.params.hotSpotId);
    if (hotSpot == null)
      return response
        .status(404)
        .send("The hotspot with the given id was not found");

    response.send(hotSpot);
  })
);

//__________________________________________________________________________________________________________
// Add a hotspot. Update if the _id already exists.
//__________________________________________________________________________________________________________
router.post(
  "/",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    // validate the hotspot
    const { error } = validateHotSpot(request.body);
    if (error) return response.status(400).send(error.details[0].message);

    // validate zoom name/id
    let zoomMap;

    if (request.body.zoomId != null) {
      zoomMap = await MapModel.findById(request.body.zoomId);
      if (zoomMap == null)
        return response
          .status(400)
          .send("The map with the given zoom map id was not found.");
    } else if (request.body.zoomName != null && request.body.zoomName != "") {
      zoomMap = await MapModel.findOne({ name: request.body.zoomName });
      if (zoomMap == null)
        return response
          .status(400)
          .send("The map with the given zoom map name was not found.");
    }

    const targetZoomId = zoomMap != null ? zoomMap._id : null;

    // get the map with all hotspots
    const map = await MapModel.findById(request.params.mapId);
    if (map == null)
      return response
        .status(404)
        .send("The map with the given id was not found");

    if (request.body._id == null) {
      // new one
      newHotSpot = {
        x: request.body.x,
        y: request.body.y,
        name: request.body.name,
        description: request.body.description,
        zoomName: request.body.zoomName,
        zoomId: targetZoomId
      };

      map.hotSpots.push(newHotSpot);

      await map.save();
      response.send(map.hotSpots[map.hotSpots.length - 1]);
    } else {
      // update the hot spot
      const hotSpot = map.hotSpots.id(request.body._id);

      if (hotSpot == null)
        return response
          .status(404)
          .send("The hotspot with the given id was not found");

      hotSpot.x = request.body.x;
      hotSpot.y = request.body.y;
      hotSpot.name = request.body.name;
      hotSpot.description = request.body.description;
      hotSpot.zoomName = request.body.zoomName;
      hotSpot.zoomId = targetZoomId;

      await map.save();
      response.send(hotSpot);
    }
  })
);

//__________________________________________________________________________________________________________
router.delete(
  "/:hotSpotId",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    // get the map
    const map = await MapModel.findById(request.params.mapId);
    if (map == null)
      return response
        .status(404)
        .send("The map with the given id was not found");

    // find the hotspot
    const index = map.hotSpots.findIndex(
      hs => hs._id == request.params.hotSpotId
    );
    if (index < 0)
      return response
        .status(404)
        .send("The hotspot with the given id was not found");

    // remove the hotspot
    map.hotSpots.splice(index, 1);
    await map.save();

    response.status(200).send("OK");
  })
);

module.exports = router;
