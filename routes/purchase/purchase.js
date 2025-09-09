const express = require("express");
const router = express.Router();
const db = require("../../db");
const nodemailer = require("nodemailer");

//create nodemailer connection with gmail smtp using .env file credentials.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


//supplier details fetching to supplier dropdown in purchase form
router.get('/supplier-details', (req, res) => {
    const sql = 'SELECT supplier_id, name FROM supplier';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching suppliers:', err);
            return res.status(500).json({ error: 'Error fetching suppliers' });
        }
        res.json(results);
    });
});

//create and add supply order details to mysql db and send mail to supplier
router.post('/purchase-item-add', (req, res) => {
  const { item_id, supplier_id, quantity, price } = req.body;

  if (!supplier_id || !item_id || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  const status = 'New';
  const sql = `INSERT INTO supply_orders (supplier_id, item_id, quantity, price, status) VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [supplier_id, item_id, quantity, price, status], (err, result) => {
      if (err) {
          console.error('Error adding purchase item:', err);
          return res.status(500).json({ error: 'Error adding purchase item' });
      }

      const supply_order_id = result.insertId;

      // Fetch supplier email
      db.query("SELECT name, email FROM supplier WHERE supplier_id = ?", [supplier_id], (err2, supplierResult) => {
          if (err2 || supplierResult.length === 0) {
              console.error('Error fetching supplier email:', err2);
              return res.status(500).json({ message: 'Purchase added but failed to fetch supplier email' });
          }

          const supplier = supplierResult[0];

          const mailOptions = {
              from: process.env.EMAIL_USER,
              to: supplier.email,
              subject: "New Purchase Order",
              text: `Hello ${supplier.name},\n\nA new purchase order has been created.\n\nOrder ID: ${supply_order_id}\nItem ID: ${item_id}\nQuantity: ${quantity}\nPrice: ${price}\nStatus: ${status}\n\nThank you.`
          };

          transporter.sendMail(mailOptions, (emailErr, info) => {
              if (emailErr) {
                  console.error("Error sending email:", emailErr);
                  return res.status(500).json({ message: 'Purchase added but email not sent' });
              }

              res.json({ message: 'Purchase item added and email sent successfully', supply_order_id });
          });
      });
  });
});

//fetch purchased items details for display in purchase bottom table
router.get('/purchased-items-details', (req,res) => {
    const sql = `
        SELECT so.supply_order_id, s.name AS supplier_name, i.name, so.quantity, so.price, so.status, so.order_date
        FROM supply_orders so
        JOIN supplier s ON so.supplier_id = s.supplier_id
        JOIN inventory i ON so.item_id = i.item_id
        ORDER BY so.order_date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching purchased items:', err);
            return res.status(500).json({ error: 'Error fetching purchased items' });
        }
        res.json(results);
    });
})

module.exports = router;
