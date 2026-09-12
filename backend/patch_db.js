const mysql = require('mysql2/promise');
require('dotenv').config();

async function patch() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await connection.query(`ALTER TABLE self_help_resource ADD COLUMN thumbnail_url VARCHAR(255) AFTER link, ADD COLUMN platform VARCHAR(50) AFTER thumbnail_url`);
        console.log("Columns 'thumbnail_url' and 'platform' added successfully.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
        } else {
            console.error("Error or columns may already exist:", err.message);
        }
    }
    
    await connection.end();
}

patch();
