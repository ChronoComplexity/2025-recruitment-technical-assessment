const request = require("supertest");

describe("Task 1", () => {
  describe("POST /parse", () => {
    const getTask1 = async (inputStr) => {
      return await request("http://localhost:8080")
        .post("/parse")
        .send({ input: inputStr });
    };

    it("Non alphabetical characters removed", async () => {
      const response = await getTask1("Riz@z RISO00tto!");
      expect(response.body).toStrictEqual({ msg: "Rizz Risotto" });
    });

    it("Dashes and underscores replaced with spaces", async () => {
      const response = await getTask1("alpHa-alFRedo_here");
      expect(response.body).toStrictEqual({ msg: "Alpha Alfredo Here" });
    });

    it("Multiple spaces removed and replaced with single space", async () => {
      const response = await getTask1("alpHa_-alFRedo    -    here");
      expect(response.body).toStrictEqual({ msg: "Alpha Alfredo Here" });
    });

    it("Whitespace from the edges removed", async () => {
      const response = await getTask1("           here    ");
      expect(response.body).toStrictEqual({ msg: "Here" });
    });

    it("Whitespace from the edges due to dashes and underscores being present removed", async () => {
      const response = await getTask1("_____here----");
      expect(response.body).toStrictEqual({ msg: "Here" });
    });

    it("error case, no input", async () => {
      const response = await getTask1("");
      expect(response.status).toBe(400);
    });

    it("error case, invalid characters input only", async () => {
      const response = await getTask1("123@");
      expect(response.status).toBe(400);
    });
  });
});

describe("Task 2", () => {
  describe("POST /entry", () => {
    const putTask2 = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    it("Add Ingredients", async () => {
      const entries = [
        { type: "ingredient", name: "Egg", cookTime: 6 },
        { type: "ingredient", name: "Lettuce", cookTime: 1 },
      ];
      for (const entry of entries) {
        const resp = await putTask2(entry);
        expect(resp.status).toBe(200);
        expect(resp.body).toStrictEqual({});
      }
    });

    it("Add Recipe", async () => {
      const meatball = {
        type: "recipe",
        name: "Meatball",
        requiredItems: [{ name: "Beef", quantity: 1 }],
      };
      const resp1 = await putTask2(meatball);
      expect(resp1.status).toBe(200);
    });

    it("Negative cookTime ingredient", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "beef",
        cookTime: -1,
      });
      expect(resp.status).toBe(400);
    });

    it("Incorrect type", async () => {
      const resp = await putTask2({
        type: "pan",
        name: "pan",
        cookTime: 20,
      });
      expect(resp.status).toBe(400);
    });

    it("Names are not unique", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 10,
      });
      expect(resp.status).toBe(200);

      const resp2 = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp2.status).toBe(400);

      const resp3 = await putTask2({
        type: "recipe",
        name: "Beef",
        requiredItems: [{ name: "Beef", quantity: 1 }]
      });
      expect(resp3.status).toBe(400);
    });
  
    it("Names are not unique within the required items of a recipe", async () => {
      const resp3 = await putTask2({
        type: "recipe",
        name: "Double Beef",
        requiredItems: [{ name: "Beef", quantity: 1 }, { name: "Beef", quantity: 1 }]
      });
      expect(resp3.status).toBe(400);
    });
  });
});

describe("Task 3", () => {
  describe("GET /summary", () => {
    const postEntry = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    const getTask3 = async (name) => {
      return await request("http://localhost:8080").get(
        `/summary?name=${name}`
      );
    };

    it("What is bro doing - Get empty cookbook", async () => {
      const resp = await getTask3("nothing");
      expect(resp.status).toBe(400);
    });

    it("What is bro doing - Get ingredient", async () => {
      const resp = await postEntry({
        type: "ingredient",
        name: "beef",
        cookTime: 2,
      });
      expect(resp.status).toBe(200);

      const resp2 = await getTask3("beef");
      expect(resp2.status).toBe(400);
    });

    it("Unknown missing item", async () => {
      const cheese = {
        type: "recipe",
        name: "Cheese",
        requiredItems: [{ name: "Not Real", quantity: 1 }],
      };
      const resp1 = await postEntry(cheese);
      expect(resp1.status).toBe(200);

      const resp2 = await getTask3("Cheese");
      expect(resp2.status).toBe(400);
    });

    it("Bro cooked", async () => {
      const meatball = {
        type: "recipe",
        name: "Skibidi",
        requiredItems: [{ name: "Bruh", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "ingredient",
        name: "Bruh",
        cookTime: 2,
      });
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Skibidi");
      expect(resp3.status).toBe(200);
      expect(resp3.body).toStrictEqual({
        "name": "Skibidi",
        "cookTime": 2,
        "ingredients": [
          {
          "name": "Bruh",
          "quantity": 1
          }
        ]
      });
    });

    it("Two of the same ingredients", async () => {
      const meatball = {
        type: "recipe",
        name: "Apples",
        requiredItems: [{ name: "Apple", quantity: 2 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "ingredient",
        name: "Apple",
        cookTime: 2,
      });
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Apples");
      expect(resp3.status).toBe(200);
      expect(resp3.body).toStrictEqual({
        "name": "Apples",
        "cookTime": 4,
        "ingredients": [
          {
          "name": "Apple",
          "quantity": 2
          }
        ]
      });
    });
    it("Two different ingredients", async () => {
      const meatball = {
        type: "recipe",
        name: "Banana splits",
        requiredItems: [{ name: "Banana", quantity: 1 }, { name: "Split", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "ingredient",
        name: "Banana",
        cookTime: 2,
      });

      expect(resp2.status).toBe(200);
      const resp3 = await postEntry({
        type: "ingredient",
        name: "Split",
        cookTime: 1,
      });
      expect(resp3.status).toBe(200);

      const resp4 = await getTask3("Banana splits");
      expect(resp4.status).toBe(200);
      expect(resp4.body).toStrictEqual({
        "name": "Banana splits",
        "cookTime": 3,
        "ingredients": [
          {
          "name": "Banana",
          "quantity": 1
          },
          {
            "name": "Split",
            "quantity": 1
          }
        ]
      });
    });
    it("Nested recipes", async () => {
      const meatball = {
        type: "recipe",
        name: "Ice cream special",
        requiredItems: [{ name: "Banana splits", quantity: 1 }, { name: "Split", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp4 = await getTask3("Ice cream special");
      expect(resp4.status).toBe(200);
      expect(resp4.body).toStrictEqual({
        "name": "Ice cream special",
        "cookTime": 4,
        "ingredients": [
          {
          "name": "Banana",
          "quantity": 1
          },
          {
            "name": "Split",
            "quantity": 2
          }
        ]
      });
    });
  });
});
