const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const db = require("../../../db"); // MySQL connection

const JWT_SECRET = "your_super_secret_key";

//create nodemailer connection with gmail smtp using .env file credentials.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    console.log(`Rejected file: ${file.originalname}, mimetype: ${file.mimetype}`);
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

function authenticateCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "customer") {
      return res.status(403).json({ error: "Access denied" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/place-order", authenticateCustomer, upload.single('payment_receipt'), async (req, res) => {
  const { prawn_type, quantity, price, location } = req.body;
  const customer_id = req.user.id;

  // 1. Validate required fields
  if (!prawn_type || !quantity || !price || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Payment receipt is required" });
  }

  try {
    // 2. Fetch customer details from DB
    const [customerRows] = await db.query(
      "SELECT customer_id as id, customer_name as name, email FROM customer WHERE customer_id = ?",
      [customer_id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = customerRows[0]; // {id, name, email}

    // 3. Save order to DB
    const [result] = await db.query(
      "INSERT INTO orders (customer_id, name, email, product, quantity, price, status, approved_or_rejected, payment_receipt_path, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        customer.customer_id,
        customer.customer_name,
        customer.email,
        prawn_type,
        quantity,
        price,
        "New",
        "Pending",
        req.file.path,
        location
      ]
    );

    const orderId = result.insertId;

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'anjulac2006@gmail.com',
      subject: 'New Order Placed',
      text:
        `New order from ${customer.customer_name} (${customer.email}):\nProduct: ${prawn_type}\nQuantity: ${quantity}\nPrice: ${price}\nLocation: ${location}\nStatus: New\nApproved/Rejected: Pending\nReceipt: ${req.file.filename}`
    });

    res.json({ message: "Order placed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});


router.get("/available-prawn-types" , (req,res) => {
    const sql = "SELECT DISTINCT name FROM inventory WHERE quantity > 10 AND category = 'Prawns'";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching prawn types:", err);
            return res.status(500).json({ error: "Server error" });
        }
        const prawnTypes = results.map(row => row.name);
        res.json({ prawnTypes });
    });
});

//Display Order Details of Customer
router.get("/Order-Status", authenticateCustomer, (req,res) => {
    const customer_id = req.user.id;

    const sql = "SELECT order_id, product, quantity, price, status, approved_or_rejected, created_at, updated_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC";

    db.query(sql, [customer_id], (err, results) => {
        if (err) {
            console.error("Error fetching order status:", err);
            return res.status(500).json({ error: "Server error" });
        }
        res.json(results);
    });
});


module.exports = router;
