const _ = require('lodash');
const bcrypt = require('bcryptjs');
const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { UserModel } = require('../models/UserModel');
const asyncMiddleware = require('../middleware/async');

//__________________________________________________________________________________________________________
//  the login route.
//__________________________________________________________________________________________________________
router.post('/', asyncMiddleware(async (request, response) => {

    const { error } = validate(request.body);
    if (error)
        return response.status(400).send(error.details[0].message);

    // 
    const user = await UserModel.findOne({ email: request.body.email });
    if (!user )
        return response.status(400).send('Invalid user or password');

    // validate the hashed passwords
    const validPassword = await bcrypt.compare(request.body.password, user.password);
    if (validPassword == false)
        return response.status(400).send('Invalid user or password');

    // record a login

    const token = user.generateAuthToken();
    response.send(token);
}));

//__________________________________________________________________________________________________________
//  This uses lower requirements than the model. It does not require the name.
//__________________________________________________________________________________________________________
function validate(req) {

    const schema = {
        email: Joi.string().min(3).max(255).required().email(),
        password: Joi.string().min(3).max(1024).required(),
    };

    return Joi.validate(req, schema);
}

module.exports = router;
