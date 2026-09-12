const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInsert() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [result] = await connection.query(
            'INSERT INTO self_help_resource (title, type, description, link, thumbnail_url, platform) VALUES (?, ?, ?, ?, ?, ?)',
            ['Test Title', 'Article', 'Test Desc', 'http://example.com', 'http://example.com/thumb.png', 'Web']
        );
        console.log("Insert successful", result);
    } catch (err) {
        console.error("Insert failed:", err);
    }
    
    await connection.end();
}

testInsert();
