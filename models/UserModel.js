const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
global.TextEncoder = require("util").TextEncoder; // due to bug in mongoose
global.TextDecoder = require("util").TextDecoder;
const mongoose = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: "String",
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 50
  },
  email: {
    type: "String",
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 255
  },
  password: {
    type: "String",
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 1024
  },
  roles: {
    type: "String",
    trim: true,
    required: true,
    minLength: 3,
    maxLength: 50
  }
});

//__________________________________________________________________________________________________________
userSchema.methods.generateAuthToken = function() {
  const payload = {
    _id: this._id,
    name: this.name,
    roles: this.roles
  };

  return jwt.sign(payload, config.jwtPrivateKey);
};

const UserModel = mongoose.model("User", userSchema);

const userJoiSchema = {
  _id: Joi.objectId(),
  name: Joi.string()
    .min(3)
    .max(50)
    .required(),
  email: Joi.string()
    .min(3)
    .max(255)
    .required()
    .email(),
  password: Joi.string()
    .min(3)
    .max(1924)
    .required(),
  roles: Joi.string()
    .min(3)
    .max(50)
    .required()
};

//__________________________________________________________________________________________________________
function validateUser(user) {
  return Joi.validate(user, userJoiSchema);
}

exports.validateUser = validateUser;
exports.UserModel = UserModel;
