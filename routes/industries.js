const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT * FROM industries`);
    return res.json({ industries: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const results = await db.query(
      `SELECT i.code, i.industry, c.name FROM industries AS i 
      LEFT JOIN company_industries AS ci ON i.code = ci.ind_code 
      LEFT JOIN companies AS c ON ci.comp_code = c.code WHERE i.code = $1`,
      [req.params.code]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(
        `There is no industry with this code '${req.params.code}`,
        404
      );
    }
    let { code, industry } = results.rows[0];
    let companies = results.rows.map((r) => r.name);
    return res.json({ code, industry, companies });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { code, industry } = req.body;
    const results = await db.query(
      "INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *",
      [code, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/:indcode/company/:compcode", async function (req, res, next) {
  try {
    const { indcode, compcode } = req.params;
    const indResults = await db.query(
      `SELECT * FROM industries WHERE code = $1`,
      [indcode]
    );
    if (indResults.rows.length === 0) {
      throw new ExpressError(`There is no industry code with ${indCode}`, 404);
    }
    const results = await db.query(
      `INSERT INTO company_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING *`,
      [compcode, indcode]
    );

    return res.status(201).json({
      result: results.rows[0],
    });
  } catch (e) {
    return next(e);
  }
});
module.exports = router;
