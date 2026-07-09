const mysql = require("mysql2");
require("dotenv").config();

const useSecureConnection =
  process.env.DB_SSL === "true" ||
  (process.env.DB_HOST &&
    process.env.DB_HOST.toLowerCase().includes("tidbcloud"));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: useSecureConnection
    ? {
        rejectUnauthorized: true,
      }
    : undefined,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to Database !");
});

// Handle connection errors and attempt reconnection
connection.on("error", (err) => {
  console.error("Database connection error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
    console.log("Attempting to reconnect...");
    connection.connect();
  } else {
    throw err;
  }
});

module.exports = connection;
