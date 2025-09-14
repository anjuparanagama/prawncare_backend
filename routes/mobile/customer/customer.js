const express = require("express");
const router = express.Router();
const db = require("../../../db"); // MySQL connection

router.post("/api/mobile/customer-orders", async (req, res) => {
  try {
    const { customer_id, prawn_type, quantity, price, status } = req.body;

    // ✅ 1. Validate required fields
    if (!customer_id || !prawn_type || !quantity || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ 2. Fetch customer details from Supabase
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, name") 
      .eq("id", customer_id)
      .single();

    if (error || !customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // ✅ 3. Insert into MySQL
    const sqlQuery = `
      INSERT INTO customer_order (customer_id, customer_name, prawn_type, quantity, price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sqlQuery, [
      customer.id,
      customer.name,
      prawn_type,
      quantity,
      price,
      status || "Pending",
    ]);

    res.json({
      message: "Order added successfully",
      orderId: result.insertId,
    });
  } catch (err) {
    console.error("Error adding order:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/mobile/available-prawn-types" , (req,res) => {
    const sql = "SELECT DISTINCT prawn_type FROM inventory WHERE stock > 0";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching prawn types:", err);
            return res.status(500).json({ error: "Server error" });
        }
        const prawnTypes = results.map(row => row.prawn_type);
        res.json({ prawnTypes });
    });
});

module.exports = router;
