const request = require("supertest");
const { MapModel } = require("../../../models/MapModel");
const { UserModel } = require("../../../models/UserModel");
const _ = require("lodash");

let server;

describe("/api/Maps", () => {
  beforeEach(async () => {
    server = require("../../../index");
    await MapModel.deleteMany({});
  });

  afterEach(async () => {
    server.close();
  });

  //__________________________________________________________________________________________________________
  async function insertMaps() {
    let imap1 = new MapModel({
      name: "TwoCities",
      description: "The region where it all happens",
      imageFilename: "TwoCities.jpg",
      hotSpots: [
        {
          x: 371,
          y: 173,
          name: "Riverside",
          description: "A mountain town.",
          zoomName: "Riverside"
        },
        {
          x: 74,
          y: 210,
          name: "Woodvine",
          description: "Where Sophie lives.",
          zoomName: "Woodvine"
        },
        {
          name: "Kernville",
          description: "Where they were attempting to connect the train to.",
          zoomName: "",
          x: 335,
          y: 33
        }
      ]
    });
    await imap1.save();

    imap2 = new MapModel({
      name: "Riverside",
      description: "A mountain town.",
      imageFilename: "Riverside.jpg",
      hotSpots: [
        {
          x: 78,
          y: 221,
          name: "Gas Station",
          description:
            "They provisioned themselves for a potentially long ordeal.",
          zoomName: ""
        },
        {
          x: 251,
          y: 208,
          name: "Visitor's Center",
          description: "They met a park ranger and Joe Condor here.",
          zoomName: ""
        },
        {
          name: "Antique Shop",
          description:
            "Ambrose, the proprietor, attempted to sell them rusty nails here.",
          zoomName: "",
          x: 375,
          y: 243
        },
        {
          name: "The bridge",
          description:
            "They crossed the bridge into spriggan territory. The seemingly ordinary bridge attempted to drop them into the gorge.",
          zoomName: "",
          x: 249,
          y: 108
        }
      ]
    });
    await imap2.save();

    imap3 = new MapModel({
      name: "Woodvine",
      description: "Where Sophie lives.",
      imageFilename: "Woodvine.jpg",
      hotSpots: [
        {
          x: 243,
          y: 208,
          name: "Marais",
          description: "Where the spriggans live.",
          zoomName: ""
        },
        {
          x: 201,
          y: 386,
          name: "Woodvine",
          description: "Where Sophie lives.",
          zoomName: ""
        },
        {
          name: "Downtown",
          description:
            "Haverston took Sophie to a Mayoral dinner at the Grand Hotel.",
          zoomName: "",
          x: 0,
          y: 0
        }
      ]
    });
    await imap3.save();

    return [imap1, imap2, imap3];
  }

  //__________________________________________________________________________________________________________
  describe("GET /", () => {
    it("should return all maps", async () => {
      await insertMaps();

      const response = await request(server).get("/api/Maps");
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);

      expect(response.body.some(m => m.name == "TwoCities")).toBeTruthy();
      expect(response.body.some(m => m.name == "Riverside")).toBeTruthy();
      expect(response.body.some(m => m.name == "Woodvine")).toBeTruthy();
    });
  });

  //__________________________________________________________________________________________________________
  describe("GET /:id", () => {
    it("should return a map if a valid id is passed", async () => {
      const maps = await insertMaps();

      targetId = maps[0]._id;
      targetName = maps[0].name;

      const response = await request(server).get(`/api/Maps/${targetId}`);
      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("name", targetName);
    });

    it("should return 404 if an invalid id is passed", async () => {
      const response = await request(server).get(
        `/api/Maps/5bb992255cc11226600224ee`
      );
      expect(response.status).toBe(404);
    });

    it("should return 404 if a bogus format id is passed", async () => {
      const response = await request(server).get(`/api/Maps/dude`);
      expect(response.status).toBe(404);
    });
  });

  //__________________________________________________________________________________________________________
  describe("GET /name/:name", () => {
    it("should return a map if a valid name is passed", async () => {
      const maps = await insertMaps(); // this constant map changes after the get

      targetId = maps[0]._id;
      targetName = maps[0].name;

      const response = await request(server).get(
        `/api/Maps/name/${targetName}`
      );
      expect(response.status).toBe(200);

      expect(response.body.name).toBe(targetName);
    });

    it("should return 404 if the name does not exist", async () => {
      const response = await request(server).get(`/api/Maps/name/bogusName`);
      expect(response.status).toBe(404);
    });

    it("should return 404 if no name is passed", async () => {
      const response = await request(server).get(`/api/Maps/name/`);
      expect(response.status).toBe(404);
    });
  });

  // post map
  // duplicate!
  // authentication & roles
  //__________________________________________________________________________________________________________
  describe("POST /", () => {
    let token;
    let guestToken;
    let map;

    beforeEach(async () => {
      token = new UserModel({
        name: "siby",
        email: "siby@gmail.com",
        roles: "abiding"
      }).generateAuthToken();

      guestToken = new UserModel({
        name: "guest",
        email: "guest@guest.com",
        roles: "guest"
      }).generateAuthToken();

      map = {
        name: "Marais",
        description: "Spriggan enclave",
        imageFilename: "marais.jpg"
      };
    });

    async function execute() {
      return (response = await request(server)
        .post(`/api/Maps`)
        .set("x-auth-token", token)
        .send(map));
    }

    it("should save and return the map if it is valid and user is logged in", async () => {
      const response = await execute();

      expect(response.status).toBe(200);

      const map = await MapModel.findById(response.body._id);
      expect(map.name).toBe("Marais");

      expect(response.body.name).toBe("Marais");
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const response = await execute();

      expect(response.status).toBe(401);
    });

    it("should return 403 if client is logged in as guest", async () => {
      token = guestToken;

      const response = await execute();

      expect(response.status).toBe(403);
    });

    it("should return 400 if client submits a bogus token", async () => {
      token = "aaaaa.bogus.bbbbbbb";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should return 400 if the map is invalid, name is less than five chars", async () => {
      map.name = "H";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should return 400 if the map is invalid, name is greater than fifty chars", async () => {
      map.name = new Array(15).join("abcde"); // repeats abcde 14 times (yeah, one less than the array length)

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should return 400 if the map is missing a description", async () => {
      map.description = "";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should perform an update if the map name is a duplicate and no _id supplied", async () => {
      await insertMaps(); // need to have something to duplicate

      targetName = "Riverside";
      map.name = targetName;
      map.description = "A happy mountain town."; // changing the description

      const response = await execute();

      expect(response.status).toBe(200);

      // confirm the description in the database is different.
      const maps = await MapModel.find({ name: targetName });

      expect(maps.length).toBe(1); // it must not have added a second document
      expect(maps[0].description).toBe("A happy mountain town.");

      expect(response.body.description).toBe("A happy mountain town.");
    });

    it("should perform an update if the _id was supplied and the name is not a duplicate", async () => {
      const maps = await insertMaps(); // need to have something to duplicate

      targetName = "Riverside";
      index = _.findIndex(maps, { name: targetName }); // locate the riverside row
      targetId = maps[index]._id;

      map._id = targetId; //
      map.name = targetName;
      map.description = "A happy mountain town."; // changing the description

      // execute
      const response = await execute();

      // validate
      expect(response.status).toBe(200);

      // confirm the description in the database is different.
      const initialMaps = await MapModel.find({ name: targetName });

      expect(initialMaps.length).toBe(1); // it must not have added a second document
      expect(initialMaps[0].description).toBe("A happy mountain town.");

      expect(response.body.description).toBe("A happy mountain town.");
    });

    it("should return an error if the _id was supplied was bogus", async () => {
      const maps = await insertMaps(); // need to have something to duplicate
      map._id = "5bb992255cc11226600224ee"; //

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return an error if the _id was supplied and the name is a duplicate", async () => {
      const maps = await insertMaps(); // need to have something to duplicate

      targetName = "Woodvine"; //
      index = _.findIndex(maps, { name: "Riverside" });
      targetId = maps[index]._id;

      map._id = targetId; // using the Riverside _id
      map.name = targetName; // with the Woodvine name
      map.description = "A happy mountain town."; // changing the description

      const response = await execute();

      // validate
      expect(response.status).toBe(404);
    });
  });

  // put map
  //__________________________________________________________________________________________________________
  describe("PUT /", () => {
    let token;
    let map;

    beforeEach(async () => {
      token = new UserModel({
        name: "siby",
        email: "siby@gmail.com",
        roles: "abiding"
      }).generateAuthToken();

      // grab the two cities record
      await insertMaps(); // these tests are all updates
      map = await MapModel.findOne({ name: "TwoCities" });
      delete map.__v;
    });

    async function execute() {
      return (response = await request(server)
        .put(`/api/Maps`)
        .set("x-auth-token", token)
        .send(map));
    }

    it("should update the description and return the map if it is valid and user is logged in", async () => {
      map.description = "New Description!";

      const response = await execute();

      if (response.status !== 200) console.log("response", response);

      expect(response.status).toBe(200);

      const updatedMap = await MapModel.findById(map._id);
      expect(updatedMap.description).toBe("New Description!");
      expect(response.body.description).toBe("New Description!");
    });

    it("should update the name and return the map if it is valid and user is logged in, and name is still unique", async () => {
      map.name = "New Name!";

      const response = await execute();

      expect(response.status).toBe(200);

      const updatedMap = await MapModel.findById(map._id);
      expect(updatedMap.name).toBe("New Name!");
      expect(response.body.name).toBe("New Name!");
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const response = await execute();

      expect(response.status).toBe(401);
    });

    it("should return 400 if client submits a bogus token", async () => {
      token = "aaaaa.bogus.bbbbbbb";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should return 400 if the map is invalid, name is less than five chars", async () => {
      map.name = "H";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should perform an update if only the description is supplied", async () => {
      map.description = "New Description!";

      const response = await execute();

      expect(response.status).toBe(200);

      const updatedMap = await MapModel.findById(map._id);
      expect(updatedMap.description).toBe("New Description!");
      expect(response.body.description).toBe("New Description!");

      expect(map.name).toBe("TwoCities"); // unchanged
      expect(response.body.name).toBe("TwoCities");
    });

    it("should return an error if the _id was supplied was bogus", async () => {
      map._id = "5bb992255cc11226600224ee"; //

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return an error if the name is a duplicate to another map", async () => {
      map.name = "Riverside";

      const response = await execute();

      expect(response.status).toBe(404);
    });
  });

  //__________________________________________________________________________________________________________
  describe("DELETE /:id", () => {
    let token;
    let targetId;

    beforeEach(async () => {
      token = new UserModel({
        name: "siby",
        email: "siby@gmail.com",
        roles: "abiding"
      }).generateAuthToken();
    });

    async function execute() {
      return (response = await request(server)
        .delete(`/api/Maps/${targetId}`)
        .set("x-auth-token", token));
    }

    it("should return 200 if a valid id is passed", async () => {
      const maps = await insertMaps(); // this constant map changes after the get
      targetId = maps[0]._id;

      const response = await execute();

      expect(response.status).toBe(200);

      // check database
      const map = await MapModel.findById({ _id: targetId });
      expect(map).toBeNull();
    });

    it("should return 404 if the id does not exist", async () => {
      targetId = "5bbbbb888886666667777aaa";
      const response = await execute();
      expect(response.status).toBe(404);
    });

    it("should return 500 if the id is bogus", async () => {
      targetId = "aaaabogusxxxx";
      const response = await execute();
      expect(response.status).toBe(500);
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";
      const maps = await insertMaps();
      targetId = maps[0]._id;

      const response = await request(server).delete(`/api/Maps/${targetId}`);

      expect(response.status).toBe(401);
    });
  });
});

//"scripts": {
//    ...
//    "test": "jest --watchAll --verbose --runInBand",
//    ...
//}
