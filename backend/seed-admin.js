const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  try {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    if (!DB_HOST || !DB_USER || !DB_NAME) {
      throw new Error('Missing DB_HOST, DB_USER or DB_NAME in .env');
    }

    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin@123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    await connection.query(
      `INSERT INTO administrator (name, email, password)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password = VALUES(password)`,
      ['System Admin', adminEmail, hashedAdminPassword]
    );

    console.log(`Admin account ensured: ${adminEmail}`);
    await connection.end();
  } catch (err) {
    console.error('Seed admin failed:', err.message);
    process.exit(1);
  }
})();
