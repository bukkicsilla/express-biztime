const request = require("supertest");
const app = require("../app");
const db = require("../db");
let testInvoice;

beforeEach(async () => {
  await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('ixl', 'IXL', 'educational') RETURNING *`
  );
  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('ixl', 100, false, null) RETURNING *`
  );
  testInvoice = results.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});

/*describe("TEST", function () {
  test("test", function () {
    expect(1).toBe(1);
  });
});*/

describe("GET /", function () {
  test("It should respond with array of invoices", async function () {
    const response = await request(app).get("/invoices");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      invoices: [
        {
          comp_code: "ixl",
          amt: 100,
          paid: false,
          paid_date: null,
          add_date: expect.any(String),
          id: expect.any(Number),
        },
      ],
    });
  });
});

describe("GET /invoices/:id", function () {
  test("It returns invoice info", async function () {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      invoice: {
        id: testInvoice.id,
        company: {
          code: "ixl",
          name: "IXL",
          description: "educational",
        },
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });

  test("It should return 404 for no such cinvoice", async function () {
    const response = await request(app).get("/invoices/000");
    expect(response.status).toEqual(404);
  });
});

describe("POST /", function () {
  test("It should add invoice", async function () {
    const response = await request(app).post("/invoices").send({
      comp_code: "ixl",
      amt: 200,
      paid: false,
      paid_date: null,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "ixl",
        amt: 200,
        paid: false,
        paid_date: null,
        add_date: expect.any(String),
      },
    });
  });
});

describe("PUT /", function () {
  test("It should update invoice", async function () {
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({
        comp_code: "ixl",
        amt: 500,
        paid: true,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: "ixl",
        amt: 500,
        paid: true,
        paid_date: expect.any(String),
        add_date: expect.any(String),
      },
    });
  });

  test("It should return 404 for no such invoice", async function () {
    const response = await request(app)
      .put("/invoices/000")
      .send({ amt: 1000 });
    expect(response.status).toEqual(404);
  });
  test("It should return 500 for missing data", async function () {
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({});
    expect(response.status).toEqual(500);
  });
});

describe("DELETE /", function () {
  test("It should delete invoice", async function () {
    const response = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("It should return 404 for no such company", async function () {
    const response = await request(app).delete("/companies/fb");
    expect(response.status).toEqual(404);
  });
});
