const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const db = require("../../../db"); 

//display order details
router.get('/order-details', (req,res) => {
  const sql = "SELECT * FROM supply_orders ORDER BY order_date DESC";

  db.query(sql, (err, results) => {
      if (err) {
          console.error('Error fetching supplier order details: ', err);
          return res.status(500).json({ error: 'Error fetching supplier order data' });
      }
      res.json(results);
  });
});

// Update order status by supplier
router.patch('/update-order', (req,res) => {
  const { order_id, status } = req.body;

  if (!order_id || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
  }

  const sql = "UPDATE supply_orders SET status = ? WHERE supply_order_id = ?";

  db.query(sql, [status, order_id], (err, results) => {
      if (err) {
          console.error('Error updating order status: ', err);
          return res.status(500).json({ error: 'Error updating order status' });
      }
      res.json({ message: 'Order status updated successfully' });
  });
});


//confirm 

module.exports = router;