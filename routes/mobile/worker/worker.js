const express = require("express");
const router = express.Router();
const cron = require("node-cron");
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

//feeding reminder system
let reminders = [];

// Check feeding times every , * - in minute → every minute, * - in hour → every hour, * - in day of month → every day, * -  in month → every month, * - in day of week → every day of week
cron.schedule("* * * * *", () => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:00`;

  const sql = `
    SELECT feeding_ID, Pond_ID, feeding_time 
    FROM feeding_schedule
    WHERE TIMEDIFF(feeding_time, ?) = '00:15:00'
  `;

  db.query(sql, [currentTime], (err, results) => {
    if (err) {
      console.error("Error checking reminders:", err);
    } else if (results.length > 0) {
      results.forEach((row) => {
        const reminder = {
          feeding_ID: row.feeding_ID,
          pond_ID: row.Pond_ID,
          reminder_time: currentTime,
          message: `Feeding reminder: Pond ${row.Pond_ID} needs feeding at ${row.feeding_time}`
        };
        reminders.push(reminder);
        console.log("Reminder created:", reminder);
      });
    }
  });
});

// Endpoint for Flutter app to fetch reminders
router.get("/reminders", (req, res) => {
  res.json(reminders);
  reminders = []; // clear after sending so Flutter doesn’t get duplicates
});



module.exports = router;