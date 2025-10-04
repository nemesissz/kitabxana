import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupDatabase() {
    let connection;
    
    try {
        // Create connection without database to create the database if it doesn't exist
        connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST || 'localhost',
            port: process.env.DATABASE_PORT || 3306,
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || '',
            charset: 'utf8mb4'
        });

        console.log('🔗 Connected to MySQL server');

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log('📋 Executing database schema...');
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.error('Error executing statement:', statement.substring(0, 50) + '...');
                        throw error;
                    }
                }
            }
        }

        console.log('✅ Database setup completed successfully!');
        console.log('📊 Tables created:');
        console.log('   - users');
        console.log('   - user_profiles');
        console.log('   - categories');
        console.log('   - pdfs');
        console.log('   - news');
        console.log('   - subscriptions');
        console.log('   - payments');
        console.log('   - audit_logs');
        console.log('');
        console.log('👤 Default admin user created:');
        console.log('   Email: admin@vergi.az');
        console.log('   Password: admin123');
        console.log('   Role: Supadmin (3)');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
setupDatabase();
