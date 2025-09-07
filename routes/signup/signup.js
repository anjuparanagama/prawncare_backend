const express = require("express");
const router = express.Router();
const db = require("../../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');

const JWT_SECRET = "your_super_secret_key";

// Generate JWT
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

// CUSTOMER SIGNUP
router.post("/customer-signup", async (req, res) => {
    const { name, email, password, confirmPassword, mobile_no } = req.body;

    if (!name || !email || !password || !confirmPassword || !mobile_no) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if email exists
    db.query("SELECT * FROM customer WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length > 0) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO customer (name, email, password, mobile_no) VALUES (?, ?, ?, ?)";
        db.query(sql, [name, email, hashedPassword, mobile_no], (error, result) => {
            if (error) {
                console.error("Signup error (customer):", error);
                return res.status(500).json({ error: "Database insert failed" });
            }

            const user = { id: result.insertId, name, email };
            const token = generateToken(user, "customer");

            res.status(201).json({
                message: "Customer registered successfully",
                token,
                user
            });
        });
    });
});



// SUPPLIER SIGNUP
router.post("/supplier-signup", async (req, res) => {
    const { name, email, password, confirmPassword, mobile_no } = req.body;

    if (!name || !email || !password || !confirmPassword || !mobile_no) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    db.query("SELECT * FROM supplier WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length > 0) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO supplier (name, email, password, mobile_no) VALUES (?, ?, ?, ?)";
        db.query(sql, [name, email, hashedPassword, mobile_no], (error, result) => {
            if (error) {
                console.error("Signup error (supplier):", error);
                return res.status(500).json({ error: "Database insert failed" });
            }

            const user = { id: result.insertId, name, email };
            const token = generateToken(user, "supplier");

            res.status(201).json({
                message: "Supplier registered successfully",
                token,
                user
            });
        });
    });
});

//Worker registration from Admin panel
router.post('/register-worker', async (req, res) => {
    const { name, email, password, mobile_no } = req.body;

    // 1. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Insert worker into DB
    const sql = "INSERT INTO worker (name, email, password, mobile_no) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, hashedPassword, mobile_no], (error, result) => {
        if (error) {
            console.error("Signup error (worker):", error);
            return res.status(500).json({ message: "Database insert failed" });
        }

        const workerId = "PF" + result.insertId; // Add PF in front of ID

        // 3. Configure Nodemailer
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // use TLS
            auth: {
                user: process.env.EMAIL_USER, // store in .env for security
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // 4. Email content
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Worker Account Details',
            text: `Hello ${name},

                Your account has been created successfully.

                Username: ${name}
                Password: ${password}
                User ID: ${workerId}

                Please login using this credentials and dont forget these things.
                `
        };

        // 5. Send email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Email send error details:', {
                    code: err.code,
                    errno: err.errno,
                    syscall: err.syscall,
                    hostname: err.hostname,
                    message: err.message,
                    stack: err.stack
                });
                return res.status(500).json({ message: 'Worker registered but email failed', error: err.message });
            }

            console.log('Email sent successfully:', info.messageId);
            res.json({ message: 'Worker registered and email sent', workerId });
        });
    });
});

module.exports = router;
