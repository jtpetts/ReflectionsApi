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
  describe("GET /:mapId/hotspots/:hotSpotId", () => {
    let initialMaps;
    let AntiqueShopMap;
    let AntiqueShopHotSpot;
    let targetMapId;
    let targetHotSpotId;

    beforeEach(async () => {
      initialMaps = await insertMaps();

      // set up the GET on the antique shop
      AntiqueShopMap = _.find(initialMaps, { name: "Riverside" });
      AntiqueShopHotSpot = _.find(AntiqueShopMap.hotSpots, {
        name: "Antique Shop"
      });
      targetMapId = AntiqueShopMap._id;
      targetHotSpotId = AntiqueShopHotSpot._id;
    });

    async function execute() {
      return (response = await request(server).get(
        `/api/Maps/${targetMapId}/hotspots/${targetHotSpotId}`
      ));
    }

    it("should return a hotspot if a valid id is passed", async () => {
      const response = await execute();

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(AntiqueShopHotSpot.name);
      expect(response.body._id.str).toBe(AntiqueShopHotSpot._id.str);
    });

    it("should return 400 if an invalid mapid is passed", async () => {
      targetMapId = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return 400 if a bogus mapid is passed", async () => {
      targetMapId = "aaaabbbbcccc11112222333x";

      const response = await execute();

      expect(response.status).toBe(500);
    });

    it("should return 400 if an invalid hotspotid is passed", async () => {
      targetHotSpotId = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return 400 if a bogus hotspotid is passed", async () => {
      targetHotSpotId = "aaaabbbbcccc11112222333x";

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return 400 if the hotspotid is not passed", async () => {
      targetHotSpotId = "";

      const response = await execute();

      expect(response.status).toBe(404);
    });
  });

  //__________________________________________________________________________________________________________
  describe("POST /:mapId/hotspots", () => {
    let token;
    let initialMaps;
    let riversideMap;
    let targetMapId;
    let trainXingHotSpot;
    const trainXingName = "Train Crossing";
    const trainXingDescription = "click me!";

    beforeEach(async () => {
      token = new UserModel({
        name: "siby",
        email: "siby@gmail.com",
        roles: "abiding"
      }).generateAuthToken();
      initialMaps = await insertMaps();

      // set up the POST on a new hotspot - the train crossing
      riversideMap = _.find(initialMaps, { name: "Riverside" });
      targetMapId = riversideMap._id;

      trainXingHotSpot = {
        x: 50,
        y: 100,
        name: trainXingName,
        description: trainXingDescription,
        zoomName: ""
      };
    });

    async function execute() {
      return (response = await request(server)
        .post(`/api/Maps/${targetMapId}/hotspots`)
        .set("x-auth-token", token)
        .send(trainXingHotSpot));
    }

    it("should create a hotspot if everything is correct and the hot spot is new", async () => {
      const response = await execute();

      expect(response.error).toBeFalsy();

      // validate that the hotspot is in the DB
      map = await MapModel.findById(targetMapId);

      expect(response.status).toBe(200);
      expect(map.hotSpots.length).toBe(riversideMap.hotSpots.length + 1);

      insertedTrainXingHotSpot = _.find(map.hotSpots, { name: trainXingName });
      expect(insertedTrainXingHotSpot.name).toBe(trainXingName);
      expect(insertedTrainXingHotSpot.description).toBe(trainXingDescription);

      // check the body for same
      expect(response.body.name).toBe(trainXingName);
      expect(response.body._id.str).toBe(insertedTrainXingHotSpot._id.str);
    });

    it("should update a hotspot if everything is correct and the hot spot exists, via id", async () => {
      // tell it to update the antique shop hotspot with the train crossing
      antiqueShop = _.find(riversideMap.hotSpots, { name: "Antique Shop" });
      trainXingHotSpot._id = antiqueShop._id;

      const response = await execute();

      expect(response.error).toBeFalsy();

      // validate that the hotspot is in the DB
      map = await MapModel.findById(targetMapId);

      expect(response.status).toBe(200);
      expect(map.hotSpots.length).toBe(riversideMap.hotSpots.length); // update - length shouldn't change

      insertedTrainXingHotSpot = _.find(map.hotSpots, { name: trainXingName });
      expect(insertedTrainXingHotSpot.name).toBe(trainXingName);
      expect(insertedTrainXingHotSpot.description).toBe(trainXingDescription);

      // validate that the antique shop is no longer there
      antiqueShop = _.find(map.hotSpots, { name: "Antique Shop" });
      expect(antiqueShop).toBeFalsy();

      // check the body for same
      expect(response.body.name).toBe(trainXingName);
      expect(response.body._id.str).toBe(insertedTrainXingHotSpot._id.str);
    });

    it("should return an error if the user does not supply an auth token", async () => {
      token = "";

      const response = await execute();

      expect(response.status).toBe(401);
    });

    it("should return an error if the hot spot name is missing", async () => {
      trainXingHotSpot.name = "";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should return an error if the hot spot name is too long", async () => {
      trainXingHotSpot.name = Array(15).join("abcde");

      const response = await execute();

      expect(response.status).toBe(400);
    });

    it("should return an error if the map id is invalid", async () => {
      targetMapId = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return an error if the map id is bogus", async () => {
      targetMapId = "aaaabbbbcccc11112222333x";

      const response = await execute();

      expect(response.status).toBe(500);
    });

    it("should return an error if the map is valid but the hotspot id does not exit", async () => {
      trainXingHotSpot._id = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should create a hotspot and initialize the zoomId if everything is correct", async () => {
      trainXingHotSpot.zoomName = "Woodvine";

      const response = await execute();

      expect(response.error).toBeFalsy();

      // validate that the hotspot is in the DB
      map = await MapModel.findById(targetMapId);

      expect(response.status).toBe(200);
      expect(map.hotSpots.length).toBe(riversideMap.hotSpots.length + 1);

      insertedTrainXingHotSpot = _.find(map.hotSpots, { name: trainXingName });
      expect(insertedTrainXingHotSpot.name).toBe(trainXingName);
      expect(insertedTrainXingHotSpot.description).toBe(trainXingDescription);

      woodvineMap = _.find(initialMaps, { name: "Woodvine" }); // verify zoomid linkage
      expect(insertedTrainXingHotSpot.zoomId.str).toBe(woodvineMap._id.str);

      // check the body for same
      expect(response.body.name).toBe(trainXingName);
      expect(response.body._id.str).toBe(insertedTrainXingHotSpot._id.str);
      expect(response.body.zoomId.str).toBe(
        insertedTrainXingHotSpot.zoomId.str
      );
    });

    it("should create a hotspot and validate the zoomId if everything is correct", async () => {
      woodvineMap = _.find(initialMaps, { name: "Woodvine" }); // verify zoomid linkage
      trainXingHotSpot.zoomId = woodvineMap._id;

      const response = await execute();

      expect(response.error).toBeFalsy();

      // validate that the hotspot is in the DB
      map = await MapModel.findById(targetMapId);

      expect(response.status).toBe(200);
      expect(map.hotSpots.length).toBe(riversideMap.hotSpots.length + 1);

      insertedTrainXingHotSpot = _.find(map.hotSpots, { name: trainXingName });
      expect(insertedTrainXingHotSpot.name).toBe(trainXingName);
      expect(insertedTrainXingHotSpot.description).toBe(trainXingDescription);

      expect(insertedTrainXingHotSpot.zoomId.str).toBe(woodvineMap._id.str);

      // check the body for same
      expect(response.body.name).toBe(trainXingName);
      expect(response.body._id.str).toBe(insertedTrainXingHotSpot._id.str);
      expect(response.body.zoomId.str).toBe(
        insertedTrainXingHotSpot.zoomId.str
      );
    });

    // zoomid failure
    it("should return an error if the zoom id is invalid", async () => {
      trainXingHotSpot.zoomId = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(400);
    });

    /*      // zoomid is for a different map than the zoomname
                it('should update a map if everything is correct and the hot spot exists, via id', async () => {
        
                    // tell it to update the antique shop hotspot with the train crossing
                    antiqueShop = _.find(riversideMap.hotSpots, { name: 'Antique Shop' });
                    trainXingHotSpot._id = antiqueShop._id;
        
                    const response = await execute();
        
                    expect(response.status).toBe(777);
                });
        
                // (duplicate hotspot name for the given mapid)
                it('should update a map if everything is correct and the hot spot exists, via id', async () => {
        
                    // tell it to update the antique shop hotspot with the train crossing
                    antiqueShop = _.find(riversideMap.hotSpots, { name: 'Antique Shop' });
                    trainXingHotSpot._id = antiqueShop._id;
        
                    const response = await execute();
        
                    expect(response.status).toBe(777);
                });
        */
  });

  //__________________________________________________________________________________________________________
  describe("DELETE /:mapId/hotspots/:hotSpotId", () => {
    let token;
    let initialMaps;
    let riversideMap;
    let antiqueShopHotSpot;
    let targetMapId;
    let targetHotSpotId;

    beforeEach(async () => {
      token = new UserModel({
        name: "siby",
        email: "siby@gmail.com",
        roles: "abiding"
      }).generateAuthToken();
      initialMaps = await insertMaps();

      // set up the GET on the antique shop
      riversideMap = _.find(initialMaps, { name: "Riverside" });
      antiqueShopHotSpot = _.find(riversideMap.hotSpots, {
        name: "Antique Shop"
      });
      targetMapId = riversideMap._id;
      targetHotSpotId = antiqueShopHotSpot._id;
    });

    async function execute() {
      return (response = await request(server)
        .delete(`/api/Maps/${targetMapId}/hotspots/${targetHotSpotId}`)
        .set("x-auth-token", token));
    }

    it("should delete the hotspot if a valid mapId and hotspotId are passed", async () => {
      const response = await execute();

      map = await MapModel.findById(targetMapId);

      expect(response.status).toBe(200);
      expect(response.error).toBeFalsy();

      expect(map.hotSpots.length).toBe(riversideMap.hotSpots.length - 1);
    });

    it("should return an error if a token is not supplied", async () => {
      token = "";

      const response = await execute();

      map = await MapModel.findById(targetMapId);

      expect(response.status).toBe(401);
    });

    it("should return an error if the mapid does not exist", async () => {
      targetMapId = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(404);
    });

    it("should return an error if the hotspotid does not exist", async () => {
      targetHotSpotId = "5bb992255cc11226600224ee";

      const response = await execute();

      expect(response.status).toBe(404);
    });
  });
});

//"scripts": {
//    ...
//    "test": "jest --watchAll --verbose --runInBand",
//    ...
//}
