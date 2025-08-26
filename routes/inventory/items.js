const express = require('express');
const router = express.Router();
const pdf = require('html-pdf');
const db = require('../../db');

router.get("/items", (req, res) => {
    const sql = "SELECT id, item_name FROM items";
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
});

router.get("/downloadpdf", (req, res) => {
  const sql = "SELECT id, item_name, quantity FROM items";
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const html = `
      <html>
        <head>
          <title>Items List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Items List</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Name</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.item_name}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const options = {
      format: 'A4',
      orientation: 'portrait'
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('PDF generation error:', err);
        return res.status(500).json({ error: 'Failed to generate PDF' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="items.pdf"');
      res.send(buffer);
    });
  });
});

module.exports = router;
