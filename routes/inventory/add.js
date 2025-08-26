const express = require('express');
const router = express.Router();
const db = require('../../db');

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

module.exports = router;
