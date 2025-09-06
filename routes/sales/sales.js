const express = require('express');
const cors = require('cors');
const db = require('../../db.js');
const {log} = require('node:console');

const router = express.Router();

router.get('/sales', (req, res) => {
    // Fetch sales records with status Completed or Delivered
    const fetchQuery = `
      SELECT
        o.order_id AS Order_ID,
        c.customer_name AS Customer,
        o.created_at AS Order_Date,
        o.status AS Status,
        o.price AS Amount,
        o.quantity AS Quantity
      FROM customer_order o
      JOIN customer c ON o.customer_id = c.customer_id
      WHERE o.status IN ('Completed', 'Delivered')
      ORDER BY o.created_at DESC
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
    const countQuery = `SELECT COUNT(*) AS totalSales FROM customer_order WHERE status IN ('Completed', 'Delivered')`;
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
    const revenueQuery = `SELECT SUM(price) AS totalRevenue FROM customer_order WHERE status IN ('Completed', 'Delivered')`;
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
      DATE_FORMAT(created_at, '%M') AS month,
      COUNT(*) AS revenue
    FROM customer_order
    WHERE status IN ('Completed', 'Delivered')
    GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%M')
    ORDER BY MONTH(created_at)
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
