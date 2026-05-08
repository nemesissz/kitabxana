import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const newPassword = 'admin123';

const pool = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 3306,
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'kitabxana',
});

const hash = await bcrypt.hash(newPassword, 10);
await pool.execute(
  "UPDATE users SET password = ? WHERE email = 'admin@vergi.az'",
  [hash]
);

console.log('✅ Admin şifrəsi yeniləndi!');
console.log('Email: admin@vergi.az');
console.log('Yeni şifrə: admin123');

await pool.end();
