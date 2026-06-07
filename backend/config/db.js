const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return DATE/DATETIME/TIMESTAMP as strings so a DATE like due_date stays
  // 'YYYY-MM-DD' instead of being shifted across timezones when serialized.
  dateStrings: true,
});

const db = pool.promise();

// Verify the connection on startup so misconfiguration fails fast and loud.
db.getConnection()
  .then((connection) => {
    console.log(`MySQL connected to database "${process.env.DB_NAME}"`);
    connection.release();
  })
  .catch((err) => {
    console.error('MySQL connection failed:', err.message);
  });

module.exports = db;
