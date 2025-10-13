const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const db = require("../../../db");
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      token = parts[1];
    } else if (parts.length === 1) {
      token = parts[0];
    }
  }

  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    console.warn('Authentication failed: token missing');
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role && decoded.role !== "worker") {
      console.warn('Authentication failed: role mismatch', decoded.role);
      return res.status(403).json({ error: "Access denied" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err && err.message ? err.message : err);
    const msg = err && err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
}

//display all approved orders to worker dashboard
router.get("/New-Orders", async (req,res) => {
    const sql = "SELECT * FROM customer_order WHERE approved_or_rejected = 'Approved' ORDER BY created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching customer-Order Details: ', err);
            return res.status(500).json({ error: 'Error fetching customer order data' });
        }
        res.json(results);
    });
});

//Update order status by worker
router.patch("/update-order-status", (req,res) => {
    const { order_id, status } = req.body;

    if (!order_id || !status) {
        return res.status(400).json({ error: 'Order ID and status are required' });
    }

    const sql = "UPDATE customer_order SET status = ? WHERE order_id = ?";

    db.query(sql, [status, order_id], (err, results) => {
        if (err) {
            console.error('Error updating order status: ', err);
            return res.status(500).json({ error: 'Error updating order status' });
        }

        res.json({
            message: 'Order status updated successfully',
            notification: {
                text: 'Order update',
                status: status,
                order_id: order_id
            }
        });
    });
});

router.get("/time-table", (req,res) => {
    const sql = "SELECT * FROM feeding_schedule ORDER BY Pond_ID ASC, feeding_time ASC";
    db.query(sql, (err, results) => {

        if (err) {
            console.error('Error fetching feeding schedule: ', err);
            return res.status(500).json({ error: 'Error fetching feeding schedule' });
        }
        res.json(results);
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

router.get("/reminders", (req, res) => {
  res.json(reminders);
  reminders = [];
});


router.get("/tasks", authenticateToken, (req, res) => {
  const user = req.user || {};
  const workerId = user.id || user.userId || user.user_id || user.worker_id || user.workerId;

  console.log("Authenticated user payload for /tasks:", user);
  if (!workerId) {
    console.warn("No worker id found in token payload — will attempt email fallback if possible");
  }

  const candidateTables = ["task", "tasks"];
  const candidateWorkerCols = ["worker_id", "workerId", "user_id", "userId", "assigned_to"];
  const candidateOrderCols = ["created_date", "created_at", "createdAt", "created"];

  function checkTableExists(table, cb) {
    const q = `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`;
    db.query(q, [table], (err, rows) => {
      if (err) return cb(err);
      cb(null, rows && rows[0] && rows[0].cnt > 0);
    });
  }

  function findColumn(table, candidates, cb) {
    const quoted = candidates.map((c) => `'${c}'`).join(",");
    const q = `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND COLUMN_NAME IN (${quoted})`;
    db.query(q, [table], (err, rows) => {
      if (err) return cb(err);
      if (!rows || rows.length === 0) return cb(null, null);
      for (const cand of candidates) {
        const found = rows.find((r) => r.COLUMN_NAME === cand);
        if (found) return cb(null, found.COLUMN_NAME);
      }
      return cb(null, rows[0].COLUMN_NAME);
    });
  }

  (function resolveTableAndColumns(i) {
    if (i >= candidateTables.length) {
      console.error("No tasks table found (checked:", candidateTables, ")");
      return res.status(500).json({ error: "Tasks table not found" });
    }
    const table = candidateTables[i];
    checkTableExists(table, (err, exists) => {
      if (err) {
        console.error("Error checking table existence:", err);
        return res.status(500).json({ error: "Error checking database schema" });
      }
      if (!exists) return resolveTableAndColumns(i + 1);
      const candidateEmailCols = ["worker_email", "email", "assigned_email", "assignee_email", "workerEmail"];

      findColumn(table, candidateWorkerCols, (err2, workerCol) => {
        if (err2) {
          console.error("Error checking columns:", err2);
          return res.status(500).json({ error: "Error checking database schema" });
        }
        findColumn(table, candidateEmailCols, (errEmail, emailCol) => {
          if (errEmail) {
            console.error("Error checking email-like columns:", errEmail);
            return res.status(500).json({ error: "Error checking database schema" });
          }

          if (!workerCol && !emailCol) {
            console.warn(`No worker-id or email-like column found in table ${table} (checked id-cols: ${candidateWorkerCols.join(",")}; email-cols: ${candidateEmailCols.join(",")})`);
            return res.status(500).json({ error: "Worker column not found in tasks table" });
          }

          findColumn(table, candidateOrderCols, (err3, orderCol) => {
          if (err3) {
            console.error("Error checking order columns:", err3);
            return res.status(500).json({ error: "Error checking database schema" });
          }
            const orderClause = orderCol ? `ORDER BY \`${orderCol}\` DESC` : "";

            // Decide how to query: prefer id-like column if we have a workerId; otherwise, if token has email and table has an email-like column, query by email
            if (workerId && workerCol) {
              const sql = `SELECT * FROM \`${table}\` WHERE \`${workerCol}\` = ? ${orderClause} LIMIT 100`;
              console.log("Querying tasks by id. table:", table, "workerCol:", workerCol, "orderCol:", orderCol, "workerId:", workerId);
              db.query(sql, [workerId], (err4, results) => {
                if (err4) {
                  console.error("Error fetching tasks by id:", err4, "SQL:", sql, "params:", [workerId]);
                  return res.status(500).json({ error: "Error fetching tasks" });
                }
                console.log("Tasks returned (by id):", Array.isArray(results) ? results.length : typeof results);
                return res.json(results);
              });
              return;
            }

            if ((!workerId || !workerCol) && emailCol && user.email) {
              const sql = `SELECT * FROM \`${table}\` WHERE \`${emailCol}\` = ? ${orderClause} LIMIT 100`;
              console.log("Querying tasks by email. table:", table, "emailCol:", emailCol, "orderCol:", orderCol, "email:", user.email);
              db.query(sql, [user.email], (err4, results) => {
                if (err4) {
                  console.error("Error fetching tasks by email:", err4, "SQL:", sql, "params:", [user.email]);
                  return res.status(500).json({ error: "Error fetching tasks" });
                }
                console.log("Tasks returned (by email):", Array.isArray(results) ? results.length : typeof results);
                return res.json(results);
              });
              return;
            }

            if (!workerId && workerCol && (user.email || user.name)) {
              const fallbackValue = user.email || user.name;

              if (fallbackValue && fallbackValue.includes("@")) {
                function findUserIdByEmail(email, cb) {
                  const candidateUserTables = ["worker", "workers", "user", "users", "employee", "employees", "staff", "staffs"];
                  const candidateUserIdCols = ["id", "user_id", "userId", "worker_id", "workerId"];
                  const candidateUserEmailCols = ["email", "worker_email", "user_email", "assigned_email"];

                  (function searchUserTable(j) {
                    if (j >= candidateUserTables.length) return cb(null, null);
                    const ut = candidateUserTables[j];
                    checkTableExists(ut, (errU, existsU) => {
                      if (errU) return cb(errU);
                      if (!existsU) return searchUserTable(j + 1);

                      findColumn(ut, candidateUserEmailCols, (errE, uEmailCol) => {
                        if (errE) return cb(errE);
                        if (!uEmailCol) return searchUserTable(j + 1);
                        findColumn(ut, candidateUserIdCols, (errId, uIdCol) => {
                          if (errId) return cb(errId);
                          if (!uIdCol) return searchUserTable(j + 1);

                          const sqlId = `SELECT \`${uIdCol}\` AS id FROM \`${ut}\` WHERE \`${uEmailCol}\` = ? LIMIT 1`;
                          db.query(sqlId, [email], (errQ, rowsQ) => {
                            if (errQ) return cb(errQ);
                            if (rowsQ && rowsQ.length > 0) return cb(null, rowsQ[0].id);
                            return searchUserTable(j + 1);
                          });
                        });
                      });
                    });
                  })(0);
                }

                findUserIdByEmail(fallbackValue, (errMap, mappedId) => {
                  if (errMap) {
                    console.error("Error mapping email to user id:", errMap);
                    return res.status(500).json({ error: "Error mapping email to user id" });
                  }
                  if (mappedId) {
                    const sql = `SELECT * FROM \`${table}\` WHERE \`${workerCol}\` = ? ${orderClause} LIMIT 100`;
                    console.log("Querying tasks by mapped id. table:", table, "workerCol:", workerCol, "orderCol:", orderCol, "mappedId:", mappedId);
                    db.query(sql, [mappedId], (err4, results) => {
                      if (err4) {
                        console.error("Error fetching tasks (mapped):", err4, "SQL:", sql, "params:", [mappedId]);
                        return res.status(500).json({ error: "Error fetching tasks" });
                      }
                      console.log("Tasks returned (mapped):", Array.isArray(results) ? results.length : typeof results);
                      return res.json(results);
                    });
                    return;
                  }
                  console.log("No user id mapping found for email, returning empty tasks list");
                  return res.json([]);
                });
                return;
              }

              const sql = `SELECT * FROM \`${table}\` WHERE \`${workerCol}\` = ? ${orderClause} LIMIT 100`;
              console.log("Fallback querying tasks. table:", table, "workerCol:", workerCol, "orderCol:", orderCol, "value:", fallbackValue);
              db.query(sql, [fallbackValue], (err4, results) => {
                if (err4) {
                  console.error("Error fetching tasks (fallback):", err4, "SQL:", sql, "params:", [fallbackValue]);
                  return res.status(500).json({ error: "Error fetching tasks" });
                }
                console.log("Tasks returned (fallback):", Array.isArray(results) ? results.length : typeof results);
                return res.json(results);
              });
              return;
            }

            console.error("Unable to resolve how to match token payload to tasks rows. workerId:", workerId, "emailCol:", emailCol, "workerCol:", workerCol);
            return res.status(400).json({ error: "Worker identifier not present in token and no suitable column found to match by email" });
          });
        });
      });
    });
  })(0);
});


module.exports = router;