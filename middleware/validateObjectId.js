﻿const mongoose = require('mongoose');

module.exports = function (request, response, next) {

    if (mongoose.Types.ObjectId.isValid(request.params.id) == false)
        return response.status(404).send('Invalid Id');

    next();
}


