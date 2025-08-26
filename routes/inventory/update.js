const express = require('express');
const router = express.Router();
const db = require('../../db');

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
