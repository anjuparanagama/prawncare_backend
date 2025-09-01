const express = require('express');
const cors = require('cors');
const db = require('../../db.js');
const {log} = require('node:console');

const router = express.Router();

router.get('/sales', (req, res) => {
    // Fetch ALL sales records without any status filtering
    const fetchQuery = `
      SELECT * FROM sales  
        ORDER BY Order_Date DESC
    `;
    log('Executing query:', fetchQuery);

    db.query(fetchQuery, (err, results) => {
        if (err) {
            log('Error fetching sales data:', err);
            return res.status(500).json({ error: 'Database query error', details: err.message });
        } else {
            res.json(results);
        }
    });
});
router.get('/sales/count', (req, res) => {
    const countQuery = `SELECT COUNT(*) AS totalSales FROM sales WHERE Status IN ('Completed', 'Delivered')`;
    db.query(countQuery, (err, results) => {
        if (err) {
            log('Error fetching sales count:', err);
            return res.status(500).json({error: 'Database query error', details: err.message});
        } else {
            res.json(results[0]);
        }
    });
});

router.get('/revenue', (req, res) => {
    const revenueQuery = `SELECT SUM(Amount) AS totalRevenue FROM sales WHERE Status IN ('Completed', 'Delivered')`;
    db.query(revenueQuery, (err, results) => {
        if (err) {
            log('Error fetching revenue data:', err);
            return res.status(500).json({error: 'Database query error', details: err.message});
        }else{
            res.json(results[0]);
        }
    });
});
router.get('/revenue/monthly', (req, res) => {
  const monthlyRevenueQuery = `
    SELECT 
      DATE_FORMAT(Order_Date, '%M') AS month,
      SUM(Amount) AS revenue
    FROM sales
    WHERE Status = 'Completed'
    GROUP BY MONTH(Order_Date), DATE_FORMAT(Order_Date, '%M')
    ORDER BY MONTH(Order_Date)
  `;

  db.query(monthlyRevenueQuery, (err, results) => {
    if (err) {
      log('Error fetching monthly revenue data:', err);
      return res.status(500).json({ error: 'Database query error', details: err.message });
    } else {
      res.json({results });
    }
  });
});

module.exports = router;