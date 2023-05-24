const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        return res.send({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING comp_code, amt', [comp_code, amt]);
        return res.status(201).json({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        let { amt, paid } = req.body;
        let id = req.params.id;
        let paid_date = null;

        const currResult = await db.query(
            'SELECT paid_date FROM invoices WHERE id = $1', [id]
        );

        if (currResult.rows.length === 0) {
            throw new ExpressError(`Invoice data not available for ${id}`, 404);
        }

        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paid_date = new Date();
        } else if (!paid) {
            paid_date = null;
        } else {
            paid_date = currPaidDate;
        }

        const results = await db.query(
            "UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date",
            [amt, paid, paid_date, id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id:${id}`, 404);
        }
        return res.json({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query('DELETE FROM invoices WHERE id = $1', [id]);
        if (results.rowCount === 0) {
            throw new ExpressError(`Can't find invoice with id:${id}`, 404);
        }
        return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
