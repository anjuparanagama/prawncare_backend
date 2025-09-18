const express = require("express");
const router = express.Router();
const db = require("../../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//still not build jwt function
// Secret key for JWT (keep safe in .env)
const JWT_SECRET = "your_super_secret_key";

/**
 * Generate JWT token
 */
function generateToken(user, role) {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: role
        },
        JWT_SECRET,
        { expiresIn: "7d" } // Token valid for 7 days
    );
}

//Admin login
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

//customer login
router.post("/customer-login", (req, res) => {
    const { userNameOrEmail, password } = req.body;

    if (!userNameOrEmail || !password) {
        return res.status(400).json({ message: "Username/Email and Password are required" });
    }

    const sql = "SELECT * FROM customer WHERE (customer_name = ? OR email = ?)";
    db.query(sql, [userNameOrEmail, userNameOrEmail], async (error, results) => {
        if (error) {
            console.error("Database error (customer):", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const customer = results[0];

            // Compare password (bcrypt)
            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid Password" });
            }

            const token = generateToken(
                { id: customer.customer_id, name: customer.customer_name, email: customer.email },
                "customer"
            );

            res.status(200).json({
                message: "Customer login successful",
                token,
                user: {
                    id: customer.customer_id,
                    name: customer.customer_name,
                    email: customer.email,
                    created_at: customer.created_at,
                },
            });
        } else {
            res.status(401).json({ message: "Invalid Username/Email" });
        }
    });
});

//worker login
router.post("/worker-login", (req, res) => {
    const { userNameOrEmail, password } = req.body;

    if (!userNameOrEmail || !password) {
        return res.status(400).json({ message: "Username/Email and Password are required" });
    }

    const sql = "SELECT * FROM worker WHERE (name = ? OR email = ?)";
    db.query(sql, [userNameOrEmail, userNameOrEmail], async (error, results) => {
        if (error) {
            console.error("Database error (worker):", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const worker = results[0];

            const isMatch = await bcrypt.compare(password, worker.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid Password" });
            }

            const token = generateToken(
                { id: worker.worker_id, name: worker.name, email: worker.email },
                "worker"
            );

            res.status(200).json({
                message: "Worker login successful",
                token,
                user: {
                    id: worker.worker_id,
                    name: worker.name,
                    email: worker.email,
                    created_at: worker.created_at,
                },
            });
        } else {
            res.status(401).json({ message: "Invalid Username/Email" });
        }
    });
});

//supplier login
router.post("/supplier-login", (req, res) => {
    const { userNameOrEmail, password } = req.body;

    if (!userNameOrEmail || !password) {
        return res.status(400).json({ message: "Username/Email and Password are required" });
    }

    const sql = "SELECT * FROM supplier WHERE (name = ? OR email = ?)";
    db.query(sql, [userNameOrEmail, userNameOrEmail], async (error, results) => {
        if (error) {
            console.error("Database error (supplier):", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const supplier = results[0];

            const isMatch = await bcrypt.compare(password, supplier.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid Password" });
            }

            const token = generateToken(
                { id: supplier.supplier_id, name: supplier.name, email: supplier.email },
                "supplier"
            );

            res.status(200).json({
                message: "Supplier login successful",
                token,
                user: {
                    id: supplier.supplier_id,
                    name: supplier.name,
                    email: supplier.email,
                    created_at: supplier.created_at,
                },
            });
        } else {
            res.status(401).json({ message: "Invalid Username/Email" });
        }
    });
});


module.exports = router;