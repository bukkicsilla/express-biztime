const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

/*router.get("/:code", async function (req, res, next) {
  try {
    const results = await db.query(
      "SELECT code, name, description FROM companies WHERE code = $1",
      [req.params.code]
    );

    if (results.rows.length === 0) {
      let notFoundError = new ExpressError(
        `There is no company with this code '${req.params.code}`,
        404
      );
      //notFoundError.status = 404;
      throw notFoundError;
    }
    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});*/

router.get("/:code", async function (req, res, next) {
  try {
    const results = await db.query(
      `SELECT c.code, c.name, c.description, i.industry FROM companies AS c 
      LEFT JOIN company_industries AS ci ON c.code = ci.comp_code 
      LEFT JOIN industries AS i ON ci.ind_code = i.code WHERE c.code = $1`,
      [req.params.code]
    );
    const invResults = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [req.params.code]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(
        `There is no company with this code '${req.params.code}`,
        404
      );
    }
    let { code, name, description } = results.rows[0];
    let industries = results.rows.map((r) => r.industry);
    let invoices = invResults.rows;
    return res.json({ code, name, description, invoices, industries });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true, strict: true });
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *",
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code = $3 RETURNING *",
      [name, description, code]
    );
    if (results.rows.length === 0) {
      let notFoundError = new ExpressError(
        `There is no company with this code '${req.params.code}`,
        404
      );
      //notFoundError.status = 404;
      throw notFoundError;
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const results = await db.query("DELETE FROM companies WHERE code = $1", [
      code,
    ]);
    if (results.rowCount === 0) {
      let notFoundError = new ExpressError(
        `There is no company with this code '${req.params.code}`,
        404
      );
      //notFoundError.status = 404;
      throw notFoundError;
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
