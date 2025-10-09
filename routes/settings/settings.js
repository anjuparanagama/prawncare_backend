const express = require("express");
const router = express.Router();
const db = require("../../db");

router.get('/registered-workers', (req,res) => {
    const sql = "SELECT id, name, email, mobile_no AS workerDetails FROM worker";

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Error fetching orders' });
        } else {
            res.json(result);
        }
    });
});

// Update worker details
router.put('/registered-workers/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, mobile_no } = req.body;

    if (!name || !email || !mobile_no) {
        return res.status(400).json({ message: 'Name, email, and mobile_no are required' });
    }

    const sql = "UPDATE worker SET name = ?, email = ?, mobile_no = ? WHERE id = ?";
    db.query(sql, [name, email, mobile_no, id], (err, result) => {
        if (err) {
            console.error('Error updating worker:', err);
            res.status(500).json({ error: 'Error updating worker' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Worker not found' });
        } else {
            res.json({ message: 'Worker updated successfully' });
        }
    });
});

// Delete worker
router.delete('/registered-workers/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM worker WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting worker:', err);
            res.status(500).json({ error: 'Error deleting worker' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Worker not found' });
        } else {
            res.json({ message: 'Worker deleted successfully' });
            console.log(`Worker with ID ${id} deleted successfully.`);
        }
    });
});

module.exports = router;
