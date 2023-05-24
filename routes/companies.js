const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");
const { route } = require("express/lib/application");


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows })
    } catch (e) {
        return next(e);
    }
})


router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query('SELECT * FROM companies WHERE code = $1', [code]);
        const invResults = await db.query('SELECT id FROM invoices WHERE comp_code = $1', [code]);
        const indResults = await db.query(
            'SELECT i.code, i.industry FROM industries AS i JOIN comp_industries AS ci ON i.code = ci.industry_code WHERE ci.company = $1', [code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with id of ${code}`, 404);
        }

        const company = results.rows[0];
        const invoices = invResults.rows.map(inv => inv.id);
        const industries = indResults.rows.map(ind => ind.id)
        company.industries = industries;
        company.invoices = invoices;

        return res.json({ "company": company });
    } catch (e) {
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        let { code } = req.params;
        const results = await db.query('SELECT * FROM industries WHERE code = $1', [code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with id of ${code}`, 404);
        }

        return res.json({ "industry": industry })
    } catch (e) {
        return next(e)

    }
});


router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, { lower: true });
        const results = await db.query(
            'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update company with id of ${code}`, 404)
        }
        return res.send({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const results = await db.query('DELETE FROM companies WHERE code = $1', [req.params.code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with id:${code}`, 404)
        }
        return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;