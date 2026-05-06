import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;
  
  try {
    // MySQL bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vergi_db',
      multipleStatements: true
    });

    console.log('✅ Database connection established');

    // SQL faylını oxu
    const sqlPath = path.join(__dirname, 'create-cvs-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Migration-i icra et
    await connection.query(sql);
    
    console.log('✅ CVs table created successfully');
    console.log('📋 CVs table structure:');
    console.log('   - id: INT (Primary Key)');
    console.log('   - title: VARCHAR(255)');
    console.log('   - description: TEXT');
    console.log('   - category: VARCHAR(100)');
    console.log('   - file_path: VARCHAR(500)');
    console.log('   - file_size: INT (KB)');
    console.log('   - downloads: INT');
    console.log('   - created_at, updated_at: TIMESTAMP');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();

