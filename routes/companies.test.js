const request = require("supertest");
const app = require("../app");
const db = require("../db");
let testCompany;

beforeEach(async () => {
  const results = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('ixl', 'IXL', 'educational') RETURNING *`
  );
  testCompany = results.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /", function () {
  test("It should respond with array of companies", async function () {
    const response = await request(app).get("/companies");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      companies: [{ code: "ixl", name: "IXL", description: "educational" }],
    });
  });
});

describe("GET /companies/:code", function () {
  test("It returns a company info", async function () {
    const response = await request(app).get("/companies/ixl");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      company: {
        code: "ixl",
        name: "IXL",
        description: "educational",
      },
    });
  });

  test("It should return 404 for no such company", async function () {
    const response = await request(app).get("/companies/fb");
    expect(response.status).toEqual(404);
  });
});

describe("POST /", function () {
  test("It should add company", async function () {
    const response = await request(app).post("/companies").send({
      code: "teleo",
      name: "TeleoSpace",
      description: "mental health startup",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      company: {
        code: "teleo",
        name: "TeleoSpace",
        description: "mental health startup",
      },
    });
  });
});

describe("PUT /", function () {
  test("It should update company", async function () {
    const response = await request(app).put("/companies/ixl").send({
      code: "ixl",
      name: "IXL Learning",
      description: "online and educational",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      company: {
        code: "ixl",
        name: "IXL Learning",
        description: "online and educational",
      },
    });
  });

  test("It should return 404 for no such company", async function () {
    const response = await request(app)
      .put("/companies/fb")
      .send({ name: "Facebook" });

    expect(response.status).toEqual(404);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app).put("/companies/ixl").send({});
    expect(response.status).toEqual(500);
  });
});

describe("DELETE /", function () {
  test("It should delete company", async function () {
    const response = await request(app).delete("/companies/ixl");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("It should return 404 for no such company", async function () {
    const response = await request(app).delete("/companies/fb");
    expect(response.status).toEqual(404);
  });
});
