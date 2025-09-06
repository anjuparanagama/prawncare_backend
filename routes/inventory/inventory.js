const express = require('express');
const router = express.Router();
const db = require('../../db');
const pdf = require('html-pdf');

router.post('/add', (req, res) => {
    const { itemName, date, qty } = req.body;
    
    // Input validation
    if (!itemName || !date || !qty) {
        return res.status(400).json({ 
            success: false, 
            message: "All fields are required" 
        });
    }

    if (isNaN(qty) || parseInt(qty) < 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Quantity must be a positive number" 
        });
    }

    const sql = 'INSERT INTO items (item_name, date, quantity) VALUES (?, ?, ?)';
    
    db.query(sql, [itemName, date, parseInt(qty)], (err, result) => {
        if (err) {
            console.error('SQL ERROR:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Database error occurred while adding item" 
            });
        }
        
        res.json({
            success: true,
            message: "Item added successfully",
            id: result.insertId
        });
    });
});

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


  router.put('/update/:id', (req,res) =>{
    const { id } = req.params;
    const { qty, date } = req.body;
    const sql = "UPDATE items SET quantity = quantity + ?, date = ? WHERE id = ?";

    db.query(sql, [qty, date, id], (err, result) => {
        if (err) {
            console.error('ERROR:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Database error occurred while updating item" 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }

        res.json({
            success: true,
            message: "Item updated successfully"
        });
    })
})

module.exports = router;
