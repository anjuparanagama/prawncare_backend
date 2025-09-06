const mysql = require('mysql2');
require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Localhost Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to Localhost Database !');
})


let supabase;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("❌ Supabase connection failed!");
} else {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );
    console.log("✅ Connected to Supabase !");
}
module.exports = connection;
