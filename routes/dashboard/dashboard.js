const express = require('express');
const router = express.Router();
const db = require('../../db.js');
const { log } = require('node:console');

router.get('/revenue', (req, res) => {
    db.query('SELECT SUM(price) AS totalRevenue FROM customer_order', (err, results) => {
      if (err) {
        log('Error in revenue query:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }
      res.json({ totalRevenue: results[0].totalRevenue });
    });
});

// ✅ Orders API
router.get('/orders', (req, res) => {
    db.query('SELECT COUNT(*) AS newOrders FROM customer_order WHERE created_at >= NOW() - INTERVAL 30 DAY', (err, results) => {
      if (err) {
        log('Error in orders query:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }
      res.json({ newOrders: results[0].newOrders });
    });
});

// ✅ Low Stock API
router.get('/low-stock', (req, res) => {       
    db.query('SELECT COUNT(*) AS low_stock_items FROM products WHERE stock < threshold', (err, results) => {
      if (err) {
        log('Error in low stock query:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ lowStockItems: results[0].low_stock_items });
    });
});

router.get('/data', (req, res) => {
    const sql = `SELECT
      DATE_FORMAT(created_at, '%M') AS month,
      SUM(price) AS revenue
  FROM customer_order
  GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%M')
  ORDER BY MONTH(created_at);`;
      
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Database query failed' });
      } else {
        res.json(results);
      }
    });
});

module.exports = router;
