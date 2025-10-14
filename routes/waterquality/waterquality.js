const express = require("express");
const cron = require("node-cron");
const router = express.Router();
const db = require("../../db");
const pdf = require('html-pdf');


//Save ESP pH Data to mysql DB every 6 hour by cron job
const ESP_IP_Ph = "192.168.1.113";

async function saveSensorsData () {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`http://${ESP_IP_Ph}/pH`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        const sql = 'INSERT INTO sensors_data (Pond_ID, pH) VALUES (?, ?)';

        const values = [1, data.ph];

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

const ESP_IP = "10.194.157.245";

async function saveSensors () {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`http://${ESP_IP}/sensors`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        const sql = 'INSERT INTO sensors_data (Pond_ID, water_level, temperature, tds ) VALUES (?, ?, ?, ?)';

        const values = [1, data.ph];

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

cron.schedule('0 */6 * * *', () => {
    console.log("Scheduled Task Running for Sensors Data...")
    saveSensorsData();
});


router.get('/sensor-data', (req, res) => {
    const sql = `
        SELECT 
            s.Pond_ID,
            s.Water_Level,
            s.WaterTemp,
            s.pH,
            s.TDS,
            DATE(s.Updated_at) AS Date,
            CONCAT(LPAD(HOUR(s.Updated_at), 2, '0'), '.00') AS Time
        FROM sensors_data s
        ORDER BY s.Pond_ID ASC, Date DESC, Time DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }

        res.json(results);
    });
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

module.exports= router;
