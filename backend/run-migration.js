const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  try {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    if (!DB_HOST || !DB_USER || !DB_NAME) {
      throw new Error('Missing DB_HOST, DB_USER or DB_NAME in .env');
    }

    console.log('Running migration (node version)');

    const connection = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD });
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.changeUser({ database: DB_NAME });

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (!migrationFiles.length) {
      throw new Error('No migration files found in migrations directory.');
    }

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = sql
        .split(/;\s*(?:\r?\n|$)/)        // split by semicolon + newline or end of file
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      console.log(`Applying migration: ${file}`);
      for (const stmt of statements) {
        try {
          await connection.query(stmt);
        } catch (err) {
          console.warn(`Migration statement warning (${file}):`, err.message);
        }
      }
    }

    const [rows] = await connection.query('SELECT COUNT(*) as college_count FROM college');
    console.log(`college_count=${rows[0]?.college_count || 0}`);

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
    console.log(`Ensured admin account exists: ${adminEmail}`);

    await connection.end();

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();