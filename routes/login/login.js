const express = require("express");
const router = express.Router();
const db = require("../../db");

router.post('/login', (req, res) => {
    const { userName, password } = req.body;

    const sql = 'SELECT * FROM admin WHERE name = ? AND password = ?';
    db.query(sql, [userName, password], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (results.length > 0) {
            const user = results[0];
            // Login successful
            res.status(200).json({ 
                message: 'Login successful',
                user: {
                    name: user.name,
                    userName: user.name,
                    created_at: user.created_at
                }
            });
        } else {
            // Invalid credentials
            res.status(401).json({ message: 'Invalid User Name or Password' });
        }
    });
});

module.exports = router;
