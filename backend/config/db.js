// config/db.js - MySQL connection pool using mysql2
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mentalhealthsys',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const ensureAppointmentSchema = async () => {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM appointment LIKE 'counselor_note'");
        if (rows.length === 0) {
            await pool.query('ALTER TABLE appointment ADD COLUMN counselor_note TEXT NULL AFTER mode');
            console.log('✅ appointment table schema ensured: counselor_note column added');
        } else {
            console.log('✅ appointment table schema ensured: counselor_note column is present');
        }
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            console.warn('⚠️ appointment table not found yet. Run migrations before using appointment updates.');
        } else if (err.errno === 1060) {
            console.log('✅ appointment table schema already has counselor_note column');
        } else {
            console.warn('⚠️ Schema ensure warning:', err.message);
        }
    }
};

// Test connection on startup
pool.getConnection()
    .then(async conn => {
        console.log('✅ MySQL connected successfully');
        await ensureAppointmentSchema();
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed:', err.message);
        process.exit(1);
    });

module.exports = pool;
