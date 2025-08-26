const express = require('express');
const router = express.Router();
const db = require('../../db');

router.get('/table', (req, res) => {
  const sql = 'SELECT * FROM Inventory';

  db.query(sql, (err, results) => {
    if (err) {
      console.log('SQL ERROR:', err);
      return res.status(500).json({
        error: 'Database error',
        message: err.message || 'Unknown error',
        code: err.code || 'NO_CODE'
      });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
