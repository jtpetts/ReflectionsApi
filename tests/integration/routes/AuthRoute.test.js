const request = require('supertest');
const bcrypt = require('bcryptjs');
const { UserModel } = require('../../../models/UserModel');
const _ = require('lodash');

let server;

describe('auth middleware', () => {

    let token;

    beforeEach(async () => {
        server = require('../../../index');
        await UserModel.deleteMany({});

        const users = await insertUser();
        token = new UserModel(_.pick(users, ['_id', 'name', 'email'])).generateAuthToken();
    });

    afterEach(async () => {
        server.close();
    });

    async function insertUser() {

        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash('wierdisspelledwrong', salt);

        const inserted = await UserModel.collection.insertMany([
            {
                name: 'siby',
                email: 'siby@gmail.com',
                password: hashedPassword,
            }
        ]);

        const user = await UserModel.collection.findOne({ _id: inserted.insertedIds['0'] });

        return {    // drop the password
            _id: user._id,
            name: user.name,
            email: user.email
        };
    }

    const execute = () => {
        return request(server)
            .get('/api/users/me')
            .set('x-auth-token', token);
    }

    it('should return 401 if no token is provided', async () => {
        token = '';

        const response = await execute();

        expect(response.status).toBe(401);
    });

    it('should return 400 if a bogus token is provided', async () => {
        token = 'aaaaa.bogus.xxxxx';

        const response = await execute();

        expect(response.status).toBe(400);
    });

    it('should return 200 and the user if a valid token is provided', async () => {

        const response = await execute();

        expect(response.status).toBe(200);

        expect(response.body.name).toBe('siby');
        expect(response.body.email).toBe('siby@gmail.com');
        expect(response.body.password).toBeUndefined();
    });
});

/*
describe('/api/Auth', () => {

    beforeEach(async () => {
        server = require('../../../index');
        await UserModel.deleteMany({});
    });

    afterEach(() => {
        server.close();
    });


    it('should return 200 and a token when the correct password is supplied for the userid', async () => {

        //request.body.email = 'siby@gmail.com';
        //request.body.password = 'wierdisspelledwrong';

        //const response = await request(server).post('/api/auth');

        //expect(response.status).toBe(404);
    });


    //it('should ', async () => {

    //    const response = await request(server).post('/api/auth');

    //    expect(response.status).toBe(404);
    //});


    //router.post('/', asyncMiddleware(async (request, response) => {

        // login is valid
        // missing email or password, or invalid versions
        // incorrect pwd

});

*/
