const express = require("express");
const cron = require("node-cron");
const router = express.Router();
const db = require("../../db");
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const ESP_IP = "192.168.1.127";

async function saveSensors () {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`http://${ESP_IP}/sensors`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        const sql = 'INSERT INTO sensors_data (Pond_ID, Water_Level, WaterTemp, TDS ) VALUES (?, ?, ?, ?)';

        const values = [1, data.waterLevelInside, data.waterTemp, data.tds];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error inserting data: ', err);
            } else {
                console.log('Data inserted successfully');
            }
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Fetch request timed out after 30 seconds');
        } else {
            console.error('Error fetching sensor data: ', error);
        }
    }
}



cron.schedule('0 */6 * * *', () => {
    console.log("Scheduled Task Running for Sensors Data...")
    saveSensors();
});


router.get('/sensorsdatacome', async (req, res) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(`http://${ESP_IP}/sensors`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch sensor data' });
        }

        const data = await response.json();
        res.json(data); // ✅ Send the JSON data to frontend
    } catch (error) {
        if (error.name === 'AbortError') {
            res.status(504).json({ error: 'Fetch request timed out after 30 seconds' });
        } else {
            res.status(500).json({ error: 'Error fetching sensor data', details: error.message });
        }
    }
});


// Helper SQL: latest record per pond
const baseQuery = `
                    SELECT s.Pond_ID, s.Water_Level, s.pH, s.WaterTemp, s.TDS
                    FROM sensors_data s
                    INNER JOIN (
                        SELECT Pond_ID, MAX(Updated_at) AS latest_time
                        FROM sensors_data
                        GROUP BY Pond_ID
                    ) latest
                    ON s.Pond_ID = latest.Pond_ID AND s.Updated_at = latest.latest_time
                `; 

// Average Water Level
router.get("/average-water-level", (req, res) => {
  const sql = `SELECT AVG(t.Water_Level) AS avg_water_level FROM (${baseQuery}) t;`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: "DB query failed" });
    const avg = result[0].avg_water_level;
    res.json({ average_water_level: avg !== null ? Number(avg).toFixed(2) : null });
  });
});

// Average pH
router.get("/average-ph", (req, res) => {
  const sql = `SELECT AVG(t.pH) AS avg_pH FROM (${baseQuery}) t;`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: "DB query failed" });
    const avg = result[0] ? result[0].avg_pH : null;
    res.json({ average_pH: avg !== null ? Number(avg).toFixed(2) : null });
  });
});

// Average Temperature
router.get("/average-temperature", (req, res) => {
  const sql = `SELECT AVG(t.WaterTemp) AS avg_temperature FROM (${baseQuery}) t;`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: "DB query failed" });
    const avg = result[0] ? result[0].avg_temperature : null;
    res.json({ average_temperature: avg !== null ? Number(avg).toFixed(2) : null });
  });
});

// Average TDS
router.get("/average-tds", (req, res) => {
  const sql = `SELECT AVG(t.TDS) AS avg_tds FROM (${baseQuery}) t;`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: "DB query failed" });
    const avg = result[0] ? result[0].avg_tds : null;
    res.json({ average_tds: avg !== null ? Number(avg).toFixed(2) : null });
  });
});

//download pdf of water quality data
router.get('/downloadpdf', (req,res) => {
  const { start, end } = req.query;
  let sql = `
              SELECT s.Pond_ID, s.Water_Level, s.pH, s.WaterTemp, s.TDS, DATE_FORMAT(s.Updated_at, '%W, %d %M %Y') AS Date, CONCAT(LPAD(HOUR(s.Updated_at), 2, '0'), '.00') AS Time
              FROM sensors_data s
            `;
  const params = [];
  if (start && end) {
      sql += ` WHERE DATE(s.Updated_at) BETWEEN ? AND ?`;
      params.push(start, end);
  }
  sql += ` ORDER BY s.Updated_at DESC`;

  db.query(sql, params, (err, results) => {
      if (err)
          return res.status(500).json({ error: err.message });

      const html =
                  `
                  <html>
                      <head>
                      <title>Water Quality List</title>
                      <style>
                          body { font-family: Arial, sans-serif; margin: 20px; }
                          h1 { color: #333; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                          th { background-color: #f2f2f2; }
                      </style>
                      </head>
                      <body>
                      <h1>Water Quality Report</h1>
                      <table>
                          <thead>
                          <tr>
                              <th>Pond ID</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Water level</th>
                              <th>pH level</th>
                              <th>Salinity level</th>
                              <th>Temperature</th>
                          </tr>
                          </thead>
                          <tbody>
                          ${results.map(sensor => `
                              <tr>
                              <td>${sensor.Pond_ID}</td>
                              <td>${sensor.Date}</td>
                              <td>${sensor.Time}</td>
                              <td>${sensor.Water_Level}</td>
                              <td>${sensor.pH}</td>
                              <td>${sensor.TDS}</td>
                              <td>${sensor.WaterTemp}</td>
                              </tr>
                          `).join('')}
                          </tbody>
                      </table>
                      </body>
                  </html>
                  `;

              const options = {
                  format: 'A4',
                  orientation: 'portrait'
              };

              pdf.create(html, options).toBuffer((err, buffer) => {
                  if (err) {
                      console.error('PDF generation error:', err);
                      return res.status(500).json({ error: 'Failed to generate PDF' });
              }

              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename="water_quality_report.pdf"');
              res.send(buffer);
      });
    });
});

// ✅ Function to check pond conditions
async function checkConditionsAndSendAlert() {
  try {
    // 1️⃣ Fetch real-time data from ESP API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`http://${ESP_IP}/sensors`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const espData = await response.json();

    // Map ESP data to pond object
    const pond = {
      Water_Level: espData.waterLevelInside,
      WaterTemp: espData.waterTemp,
      TDS: espData.tds
    };

    // 2️⃣ Get threshold values
    const thresholdResult = await db.promise().query("SELECT * FROM thresholds LIMIT 1");
    if (thresholdResult[0].length === 0) {
      console.error("No thresholds found");
      return;
    }

    const t = thresholdResult[0][0];

    // 3️⃣ Check each condition (skip pH as it's not in ESP data)
    let alerts = [];

    if (pond.Water_Level < t.min_water_level || pond.Water_Level > t.max_water_level)
      alerts.push(`⚠️ Water level out of range: ${pond.Water_Level}`);

    if (pond.WaterTemp < t.min_temperature || pond.WaterTemp > t.max_temperature)
      alerts.push(`⚠️ Temperature out of range: ${pond.WaterTemp}`);

    if (pond.TDS < t.min_tds || pond.TDS > t.max_tds)
      alerts.push(`⚠️ TDS out of range: ${pond.TDS}`);

    // 4️⃣ If any alerts, fetch worker emails and send email
    if (alerts.length > 0) {
      const message = alerts.join("\n");

      // Fetch all worker emails
      const workerResult = await db.promise().query("SELECT email FROM worker");
      const workerEmails = workerResult[0].map(row => row.email);

      if (workerEmails.length === 0) {
        console.error("No worker emails found to send alerts");
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: workerEmails.join(', '),
        subject: "🚨 Pond Condition Alert",
        text: message
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email send failed:", error);
        } else {
          console.log("✅ Alert email sent to all workers:", info.response);
        }
      });
    } else {
      console.log("✅ All conditions normal.");
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Fetch request timed out after 30 seconds');
    } else {
      console.error('Error fetching sensor data for alerts:', error);
    }
  }
}


// ✅ Run check every 1 minute (you can change this)
setInterval(checkConditionsAndSendAlert, 60 * 1000);

module.exports= router;
