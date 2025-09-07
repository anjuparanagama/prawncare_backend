const express = require("express");
const router = express.Router();
const db = require("../../db");

router.get('/registered-workers', (req,res) => {
    const sql = "SELECT id, name, email, mobile_no AS workerDetails FROM worker";

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Error fetching orders' });
        } else {
            res.json(result);
        }
    });
});

module.exports = router;