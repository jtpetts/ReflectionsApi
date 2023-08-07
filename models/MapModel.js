const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
global.TextEncoder = require("util").TextEncoder; // due to bug in mongoose
global.TextDecoder = require("util").TextDecoder;
const mongoose = require("mongoose");

const hotSpotSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  name: {
    type: String,
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 50
  },
  description: {
    type: String,
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 2000
  },
  zoomName: {
    type: String,
    trim: true,
    required: false,
    minLength: 0,
    maxLength: 100
  },
  zoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Maps",
    required: false
  }
});

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 50
  },
  description: {
    type: String,
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 2000
  },
  imageFilename: {
    type: String,
    trim: true,
    minLength: 3,
    maxLength: 50
  },

  hotSpots: [hotSpotSchema]
});

const MapModel = mongoose.model("Map", mapSchema);

// static method:
// MapModel.statics.dude = function( params ) {
//  can use this...?
//}
// instance method:
// MapModel.methods.dude = function( params ) {
//  use this.
//}

const hotSpotJoiSchema = {
  _id: Joi.objectId(),
  x: Joi.number(),
  y: Joi.number(),
  name: Joi.string()
    .min(3)
    .max(50)
    .required(),
  description: Joi.string()
    .min(3)
    .max(2000)
    .required(),
  zoomName: Joi.string()
    .allow("")
    .max(100),
  zoomId: Joi.objectId()
    .allow("")
    .allow(null)
};

const mapJoiSchema = {
  _id: Joi.objectId(),
  name: Joi.string()
    .min(3)
    .max(50)
    .required(),
  description: Joi.string()
    .min(3)
    .max(2048)
    .required(),
  imageFilename: Joi.string()
    .min(3)
    .max(50)
    .required(),
  hotSpots: Joi.array()
    .min(0)
    .items(Joi.object(hotSpotJoiSchema))
};

//__________________________________________________________________________________________________________
function validateMap(map) {
  return Joi.validate(map, mapJoiSchema);
}

//__________________________________________________________________________________________________________
function validateHotSpot(hotSpot) {
  return Joi.validate(hotSpot, hotSpotJoiSchema);
}

exports.MapModel = MapModel;
exports.validate = validateMap;
exports.validateHotSpot = validateHotSpot;
