const express = require("express");
const router = express.Router();
const db = require("../../db");

router.get('/order', (req, res) => {
    const query = `
        SELECT 
            o.order_id,
            c.customer_name AS Customer,
            o.prawn_type AS PrawnType,
            o.quantity AS Quantity,
            o.price AS Amount,
            o.status AS Status,
            o.created_at AS Date
        FROM customer_order o
        JOIN customer c ON o.customer_id = c.customer_id
        ORDER BY o.created_at DESC
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Error fetching orders' });
        } else {
            res.json(result);
        }
    });
});


// POST endpoint to add new orders
router.post('/orders', (req, res) => {
    const { Order_ID, Customer, Date, Status, Amount, Quantity } = req.body;
    
    if (!Order_ID || !Customer || !Date || !Status || !Amount || !Quantity) {
        return res.status(400).json({ error: 'All fields are required' });
    } 
    db.query(sqlQuery, [Order_ID, Customer, Date, Status, Amount, Quantity], (err, result) => {
        if (err) {
            log('Error adding order:', err);
            res.status(500).json({ error: 'Error adding order' });
        } else {
            res.json(result);
    }});
});



// POST endpoint to add new orders
router.post('/order', (req, res) => {
    const { customer_id, prawn_type, quantity, price, status } = req.body;
    
    if (!customer_id || !prawn_type || !quantity || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sqlQuery = `
        INSERT INTO customer_order (customer_id, prawn_type, quantity, price, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sqlQuery, [customer_id, prawn_type, quantity, price, status || 'Processing'], (err, result) => {
        if (err) {
            console.error('Error adding order:', err);
            res.status(500).json({ error: 'Error adding order' });
        } else {
            res.json({ message: 'Order added successfully', orderId: result.insertId });
        }
    });
});


// POST endpoint to add new orders
router.post('/orders', (req, res) => {
    const { Order_ID, Customer, Date, Status, Amount, Quantity } = req.body;
    
    if (!Order_ID || !Customer || !Date || !Status || !Amount || !Quantity) {
        return res.status(400).json({ error: 'All fields are required' });
    } 
    db.query(sqlQuery, [Order_ID, Customer, Date, Status, Amount, Quantity], (err, result) => {
        if (err) {
            log('Error adding order:', err);
            res.status(500).json({ error: 'Error adding order' });
        } else {
            res.json(result);
    }});
});

// ✅ Daily quantity totals with year
router.get('/orders/daily', (req, res) => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    
    const sqlQuery = `
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, 
               YEAR(created_at) as year,
               SUM(Quantity) AS total_quantity
        FROM customer_order
        WHERE YEAR(created_at) IN (?, ?)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), YEAR(created_at)
        ORDER BY day ASC
    `;
    db.query(sqlQuery, [currentYear, prevYear], (err, result) => {
        if (err) {
            console.error('Error fetching daily orders:', err);
            res.status(500).json({ error: 'Error fetching daily orders' });
        } else {
            res.json(result);
        }
    });
});

// ✅ Weekly quantity totals with previous year
router.get('/orders/weekly', (req, res) => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    
    const sqlQuery = `
        SELECT YEAR(created_at) AS year, 
               WEEK(created_at) AS week, 
               SUM(Quantity) AS total_quantity
        FROM customer_order
        WHERE YEAR(created_at) IN (?, ?)
        GROUP BY YEAR(created_at), WEEK(created_at)
        ORDER BY year, week
    `;
    db.query(sqlQuery, [currentYear, prevYear], (err, result) => {
        if (err) {
            log('Error fetching weekly orders:', err);
            res.status(500).send('Error fetching weekly orders');
        } else {
            res.json(result);
        }
    });
});

// ✅ Monthly quantity totals with previous year
router.get('/orders/monthly', (req, res) => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    
    const sqlQuery = `
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            YEAR(created_at) as year,
            SUM(Quantity) AS total_quantity
        FROM customer_order
        WHERE YEAR(created_at) IN (?, ?)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m'), YEAR(created_at)
        ORDER BY month ASC
    `;

    db.query(sqlQuery, [currentYear, prevYear], (err, result) => {
        if (err) {
            log('Error fetching monthly orders:', err);
            res.status(500).send('Error fetching monthly orders');
        } else {
            res.json(result);
        }
    });
});

module.exports = router;