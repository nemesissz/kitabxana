import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'vergi_db',
      multipleStatements: true
    });

    console.log('✅ Database connection established');

    // Read migration file
    const migrationPath = join(__dirname, '../database/services-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');

    // Execute migration
    await connection.execute(migrationSQL);

    console.log('🎉 Services migration executed successfully!');
    console.log('📋 Services table created and populated with default data');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

runMigration();