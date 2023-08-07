const { UserModel } = require('../../../models/UserModel');
const auth = require('../../../middleware/auth');
const mongoose = require('mongoose');

describe('auth middleware', () => {
    it('should populate req.user with the payload of a valid JWT', () => {
        const user = {
            _id: ( new mongoose.Types.ObjectId() ).toHexString(),
            roles: 'abiding'
        };
        const token = new UserModel(user).generateAuthToken();

        const request = {
            header: jest.fn().mockReturnValue(token)
        };
        const response = {};
        const next = jest.fn();

        auth(request, response, next);

        expect(request.user).toMatchObject(user);
    });
});
