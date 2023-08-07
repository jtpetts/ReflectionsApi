const request = require("supertest");
const bcrypt = require("bcryptjs");
const { UserModel } = require("../../../models/UserModel");

let server;

describe("/api/Auth", () => {
  beforeEach(async () => {
    server = require("../../../index");
    await UserModel.deleteMany({});
  });

  afterEach(() => {
    server.close();
  });

  async function insertUser() {
    const salt = await bcrypt.genSalt(10);
    hashedPasswordWierd = await bcrypt.hash("wierdisspelledwrong", salt);
    hashedPasswordGuest = await bcrypt.hash("guest", salt);

    return await UserModel.collection.insertMany([
      {
        name: "siby",
        email: "siby@gmail.com",
        password: hashedPasswordWierd,
        roles: "abiding"
      },
      {
        name: "guest",
        email: "guest@guest.com",
        password: hashedPasswordGuest,
        roles: "guest"
      }
    ]);
  }

  it("should ", async () => {
    //request.body.email = 'siby@gmail.com';
    //request.body.password = 'wierdisspelledwrong';
    //const response = await request(server).post('/api/auth');
    //expect(response.status).toBe(404);
  });
});
