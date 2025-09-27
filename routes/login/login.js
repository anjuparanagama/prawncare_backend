const express = require("express");
const router = express.Router();
const db = require("../../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "123abc";

/**
 * Generate JWT token
 */
function generateToken(user, role, expiresIn = "7d") {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: role
        },
        JWT_SECRET,
        { expiresIn: expiresIn }
    );
}

//Admin login
router.post('/login', (req, res) => {
    const userName = req.body?.userName;
    const password = req.body?.password;
    const rememberMe = req.body?.rememberMe;

    if (!userName || !password) {
        return res.status(400).json({ message: 'User Name and Password are required' });
    }

    const sql = 'SELECT * FROM admin WHERE name = ? AND password = ?';
    db.query(sql, [userName, password], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (results.length > 0) {
            const user = results[0];
            const token = generateToken(
                { id: user.id, name: user.name, email: user.email || '' },
                "admin",
                rememberMe ? "30d" : "1d"
            );
            // Login successful
            res.status(200).json({
                message: 'Login successful',
                token,
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
    const userNameOrEmail = req.body?.userNameOrEmail;
    const password = req.body?.password;

    const trimmedUserNameOrEmail = userNameOrEmail?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUserNameOrEmail || !trimmedPassword) {
        return res.status(400).json({ message: "Username/Email and Password are required" });
    }

    const sql = "SELECT * FROM customer WHERE (customer_name = ? OR email = ?)";
    db.query(sql, [trimmedUserNameOrEmail, trimmedUserNameOrEmail], async (error, results) => {
        if (error) {
            console.error("Database error (customer):", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const customer = results[0];

            // Compare password (bcrypt)
            const isMatch = await bcrypt.compare(trimmedPassword, customer.password);
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

// Worker login
router.post("/worker-login", (req, res) => {
    const userNameOrEmail = req.body?.userNameOrEmail;
    const password = req.body?.password;
    const rememberMe = req.body?.rememberMe;

    const trimmedUserNameOrEmail = userNameOrEmail?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUserNameOrEmail || !trimmedPassword) {
        return res.status(400).json({ message: "Username/Email and Password are required" });
    }

    const sql = "SELECT * FROM worker WHERE (name = ? OR email = ?)";
    db.query(sql, [trimmedUserNameOrEmail, trimmedUserNameOrEmail], async (error, results) => {
        if (error) {
            console.error("Database error (worker):", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const worker = results[0];

            // Compare hashed password with bcrypt
            const isMatch = await bcrypt.compare(trimmedPassword, worker.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid Password" });
            }

            // Generate token with role worker & expiry based on rememberMe
            const token = generateToken(
                { id: worker.worker_id, name: worker.name, email: worker.email },
                "worker",
                rememberMe ? "30d" : "1d"
            );

            res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: worker.worker_id,
                    name: worker.name,
                    userName: worker.name,
                    email: worker.email,
                    created_at: worker.created_at
                },
            });
        } else {
            res.status(401).json({ message: "Invalid Username or Email" });
        }
    });
});


//supplier login
router.post("/supplier-login", (req, res) => {
    const userNameOrEmail = req.body?.userNameOrEmail;
    const password = req.body?.password;

    const trimmedUserNameOrEmail = userNameOrEmail?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUserNameOrEmail || !trimmedPassword) {
        return res.status(400).json({ message: "Username/Email and Password are required" });
    }

    const sql = "SELECT * FROM supplier WHERE (name = ? OR email = ?)";
    db.query(sql, [trimmedUserNameOrEmail, trimmedUserNameOrEmail], async (error, results) => {
        if (error) {
            console.error("Database error (supplier):", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const supplier = results[0];

            const isMatch = await bcrypt.compare(trimmedPassword, supplier.password);
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