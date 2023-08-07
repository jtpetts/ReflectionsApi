const _ = require("lodash");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const {
  validateUser,
  generateAuthToken,
  UserModel
} = require("../models/UserModel");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

//__________________________________________________________________________________________________________
//  returns who is logged in.
//__________________________________________________________________________________________________________
router.get(
  "/me",
  auth,
  asyncMiddleware(async (request, response) => {
    const user = await UserModel.findById(request.user._id).select("-password");

    response.send(user);
  })
);

//__________________________________________________________________________________________________________
router.get(
  "/",
  asyncMiddleware(async (request, response) => {
    const users = await UserModel.find();
    if (users == null) return response.status(404).send("There are no users!");

    response.send(users);
  })
);

//__________________________________________________________________________________________________________
router.get(
  "/:id",
  asyncMiddleware(async (request, response) => {
    const user = await UserModel.findById(request.params.id);
    if (user == null)
      return response
        .status(404)
        .send("The user with the given ID was not found");

    response.send(user);
  })
);

//__________________________________________________________________________________________________________
router.get(
  "/email/:email",
  asyncMiddleware(async (request, response) => {
    const user = await UserModel.findOne({ email: request.params.email });
    if (user == null)
      return response
        .status(404)
        .send("The user with the given email was not found");

    response.send(user);
  })
);

//__________________________________________________________________________________________________________
router.post(
  "/",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    const { error } = validateUser(request.body);
    if (error) return response.status(400).send(error.details[0].message);

    // verify the email is unique
    const duplicate = await UserModel.findOne({ email: request.body.email });
    if (duplicate) return response.status(400).send("User already exists");

    // all good, save and return
    user = new UserModel(
      _.pick(request.body, ["name", "email", "password", "roles"])
    );

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    const token = user.generateAuthToken();
    response
      .header("x-auth-token", token)
      .send(_.pick(user, ["_id", "name", "email", "roles"]));
  })
);

//__________________________________________________________________________________________________________
router.delete(
  "/:id",
  auth,
  admin,
  asyncMiddleware(async (request, response) => {
    await UserModel.deleteOne({ _id: request.params.id });
    response.status(200).send("OK");
  })
);

module.exports = router;
