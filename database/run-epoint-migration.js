import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🚀 Starting E-point migration...\n');

async function runMigration() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'vergi_db',
      multipleStatements: true // Allow multiple SQL statements
    });

    console.log('✅ Database connection established\n');

    // Read SQL migration file
    const sqlFilePath = join(__dirname, 'epoint-migration.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf-8');

    console.log('📄 Executing migration SQL...\n');

    // Execute migration
    await connection.query(sqlContent);

    console.log('✅ Migration completed successfully!\n');

    // Show updated payments table structure
    const [columns] = await connection.query('DESCRIBE payments');
    console.log('📊 Payments table structure:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run migration
runMigration();

