const mysql = require('mysql2/promise');
require('dotenv').config();

async function desc() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [result] = await connection.query('DESCRIBE self_help_resource');
        console.log("Schema:", result);
    } catch (err) {
        console.error("Error:", err);
    }
    
    await connection.end();
}

desc();
