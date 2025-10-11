const express = require("express");
const router = express.Router();
const db = require("../../../db"); 
const nodemailer = require('nodemailer');

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

// Update order status for specific supplier
router.patch('/update-order-status', (req, res) => {
  const { supplier_id, order_id, status } = req.body;

  if (!supplier_id || !order_id || !status) {
      return res.status(400).json({ error: 'Supplier ID, Order ID, and status are required' });
  }

  const sql = "UPDATE supply_orders SET status = ? WHERE supply_order_id = ? AND supplier_id = ?";

  db.query(sql, [status, order_id, supplier_id], (err, results) => {
      if (err) {
          console.error('Error updating order status: ', err);
          return res.status(500).json({ error: 'Error updating order status' });
      }
      if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Order not found or not owned by this supplier' });
      }
      // Fetch order details for email content
      const orderSql = `
        SELECT so.*, i.name AS item_name, s.name AS supplier_name
        FROM supply_orders so
        LEFT JOIN inventory i ON so.item_id = i.item_id
        LEFT JOIN supplier s ON so.supplier_id = s.supplier_id
        WHERE so.supply_order_id = ?
      `;

      db.query(orderSql, [order_id], (err2, orderRows) => {
          if (err2) {
              console.error('Error fetching order after update: ', err2);
              return res.json({ message: 'Order status updated successfully (failed to fetch order for notification)' });
          }
          const order = orderRows && orderRows[0];

          const managerEmail = 'anjulac2006@gmail.com';

          const transporter = nodemailer.createTransport({
              host: process.env.EMAIL_HOST || 'smtp.gmail.com',
              port: process.env.EMAIL_PORT || 587,
              secure: false,
              auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS
              }
          });

          const subject = `Supply order #${order_id} status updated to "${status}"`;
          const text = `Order ID: ${order_id}\nItem: ${order ? order.item_name : 'N/A'}\nSupplier: ${order ? order.supplier_name : 'N/A'}\nNew status: ${status}\nOrder date: ${order ? order.order_date : 'N/A'}`;

          const mailOptions = {
              from: process.env.FROM_EMAIL || process.env.SMTP_USER,
              to: managerEmail,
              subject,
              text,
          };

          transporter.sendMail(mailOptions, (mailErr, info) => {
              if (mailErr) {
                  console.error('Error sending notification email: ', mailErr);
                  return res.json({ message: 'Order status updated successfully (failed to send notification email)' });
              }
              return res.json({ message: 'Order status updated successfully; manager notified' });
          });
        });
    });
});

// Get supply orders for specific supplier
router.get('/supply-orders', (req, res) => {
  const supplier_id = req.query.supplier_id;

  if (!supplier_id) {
      return res.status(400).json({ error: 'Supplier ID is required' });
  }

  const sql = "SELECT so.*, i.name AS item_name FROM supply_orders so JOIN inventory i ON so.item_id = i.item_id WHERE so.supplier_id = ? ORDER BY so.order_date DESC";

  db.query(sql, [supplier_id], (err, results) => {
      if (err) {
          console.error('Error fetching supplier orders: ', err);
          return res.status(500).json({ error: 'Error fetching supplier orders' });
      }
      res.json(results);
  });
});


module.exports = router;