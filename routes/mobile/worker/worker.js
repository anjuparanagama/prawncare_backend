const express = require("express");
const router = express.Router();
const db = require("../../../db"); // MySQL connection

//display all approved orders to worker dashboard
router.get("/New-Orders", async (req,res) => {
    const sql = "SELECT * FROM customer_order WHERE approved_or_rejected == 'Approved' ORDER BY created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching customer-Order Details: ', err);
            return res.status(500).json({ error: 'Error fetching customer order data' });
        }
        res.json(results);
    });
});

//Update order status by worker
router.patch("/Update-Order-Status", (req,res) => {
    const sql = "UPDATE customer_order SET status = ? WHERE order_id = ?";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error updating order status: ', err);
            return res.status(500).json({ error: 'Error updating order status' });
        }
        res.json({ message: 'Order status updated successfully' });
    });
});

module.exports = router;