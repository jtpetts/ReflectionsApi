const express = require("express");
const router = express.Router();
const _ = require("lodash");
const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { validate, validateHotSpot } = require("../models/MapModel");
const { MapModel } = require("../models/MapModel");

//__________________________________________________________________________________________________________
router.get(
  "/",
  asyncMiddleware(async (request, response) => {
    const maps = await MapModel.find();
    response.send(maps);
  })
);

//__________________________________________________________________________________________________________
router.get(
  "/:id",
  validateObjectId,
  asyncMiddleware(async (request, response) => {
    const map = await MapModel.findById(request.params.id);
    if (map == null)
      return response
        .status(404)
        .send("The map with the given ID was not found");

    response.send(map);
  })
);

//__________________________________________________________________________________________________________
//  Name is enforced as unique.
//__________________________________________________________________________________________________________
router.get(
  "/name/:name",
  asyncMiddleware(async (request, response) => {
    const map = await MapModel.findOne({ name: request.params.name });
    if (map == null)
      return response
        .status(404)
        .send("The map with the given name was not found");

    response.send(map);
  })
);

//__________________________________________________________________________________________________________
router.post(
  "/",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    const { error } = validate(request.body);
    if (error) {
      return response.status(400).send(error.details[0].message);
    }

    let map;

    mapByName = await MapModel.findOne({ name: request.body.name });

    if (request.body._id == null) {
      map = mapByName == null ? new MapModel() : mapByName;
    } else {
      map = await MapModel.findOne({ _id: request.body._id });
      if (map == null)
        return response
          .status(404)
          .send("The map with the given ID was not found");

      if (map.name != request.body.name)
        return response
          .status(404)
          .send("The given map name is already in use");
    }

    map.name = request.body.name;
    map.description = request.body.description;
    map.imageFilename = request.body.imageFilename;

    map.hotSpots = request.body.hotSpots;

    await map.save();
    response.send(map);
  })
);

//__________________________________________________________________________________________________________
router.put(
  "/",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    delete request.body.__v;

    const { error } = validate(request.body);
    if (error) {
      return response.status(400).send(error.details[0].message);
    }

    //{"name":"Riverside","_id":{$ne:ObjectId("5bd730fa0420594688581207")}}
    // there must be only one map with the given name
    mapByName = await MapModel.findOne({
      name: request.body.name,
      _id: { $ne: request.body._id }
    });

    if (mapByName)
      return response.status(404).send("The given map name is already in use");

    const map = await MapModel.findOne({ _id: request.body._id });
    if (map == null)
      return response
        .status(404)
        .send("The map with the given ID was not found");

    // if (errors.hasOwnProperty('error_1') && typeof errors['error_1'] === 'string' && errors['error_1'].length)
    // Now, if you are using a library like underscore you can use a bunch of utility classes like _.isEmpty _.has(obj,key) and _.isString()
    // merge the properties that have been sent in. put is a partial update
    map.name = _.has(request.body, "name") ? request.body.name : map.name;
    map.description = _.has(request.body, "description")
      ? request.body.description
      : map.description;
    map.imageFilename = _.has(request.body, "imageFilename")
      ? request.body.imageFilename
      : map.imageFilename;

    map.hotSpots = _.has(request.body, "hotSpots")
      ? request.body.hotSpots
      : map.hotSpots;

    await map.save();
    response.send(map);
  })
);

//__________________________________________________________________________________________________________
router.delete(
  "/:id",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    const map = await MapModel.deleteOne({ _id: request.params.id });
    if (map.deletedCount == 0)
      return response
        .status(404)
        .send("The map with the given id was not found");

    response.status(200).send("OK");
  })
);

module.exports = router;
