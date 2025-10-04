import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file explicitly
dotenv.config({ path: join(__dirname, '../../.env') });

// Debug: Log ALL environment variables related to database
console.log('🔧 All Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('DATABASE_USER:', process.env.DATABASE_USER);
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? `[${process.env.DATABASE_PASSWORD.length} chars]` : 'NOT SET');
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);

const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'vergi_db',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectionLimit: 10
};

console.log('🔧 Final Database Config:');
console.log('Host:', dbConfig.host);
console.log('Port:', dbConfig.port);
console.log('User:', dbConfig.user);
console.log('Password:', dbConfig.password ? '[SET]' : '[EMPTY]');
console.log('Database:', dbConfig.database);

// Create connection pool
let pool;

try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL pool created successfully');
} catch (error) {
    console.error('❌ Failed to create MySQL pool:', error.message);
    
    // Try alternative configurations if the main one fails
    console.log('🔄 Trying alternative database configurations...');
    
    const alternatives = [
        {
            ...dbConfig,
            user: 'root',
            password: '',
            database: 'vergi_db'
        },
        {
            ...dbConfig,
            database: 'muhasibatjurnal_vergi'
        },
        {
            ...dbConfig,
            database: 'vergi'
        }
    ];

    for (const altConfig of alternatives) {
        try {
            console.log(`🔄 Trying: ${altConfig.user}@${altConfig.host}/${altConfig.database}`);
            pool = mysql.createPool(altConfig);
            console.log('✅ Alternative configuration worked!');
            break;
        } catch (altError) {
            console.log(`❌ Alternative failed: ${altError.message}`);
        }
    }
    
    if (!pool) {
        console.error('❌ All database configurations failed');
        process.exit(1);
    }
}

// Test connection function
export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('📦 Connected to MySQL database successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Execute query function
export async function executeQuery(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Query execution error:', error.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
    }
}

// Get single row
export async function getOne(sql, params = []) {
    const rows = await executeQuery(sql, params);
    return rows[0] || null;
}

// Insert and get inserted ID
export async function insert(tableName, data) {
    try {
        // Filter out undefined values and convert to null
        const cleanData = {};
        Object.keys(data).forEach(key => {
            cleanData[key] = data[key] === undefined ? null : data[key];
        });
        
        const fields = Object.keys(cleanData).join(', ');
        const placeholders = Object.keys(cleanData).map(() => '?').join(', ');
        const values = Object.values(cleanData);
        
        const sql = `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders})`;
        const [result] = await pool.execute(sql, values);
        return result.insertId;
    } catch (error) {
        console.error('Insert error:', error.message);
        console.error('Table:', tableName);
        console.error('Data:', data);
        throw error;
    }
}

// Update and get affected rows
export async function update(tableName, id, data) {
    try {
        // Filter out undefined values and convert to null
        const cleanData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                cleanData[key] = data[key] === null ? null : data[key];
            }
        });
        
        // Only proceed if there's data to update
        if (Object.keys(cleanData).length === 0) {
            return 0; // No changes
        }
        
        const fields = Object.keys(cleanData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(cleanData), id];
        
        const sql = `UPDATE ${tableName} SET ${fields} WHERE id = ?`;
        const [result] = await pool.execute(sql, values);
        return result.affectedRows;
    } catch (error) {
        console.error('Update error:', error.message);
        console.error('Table:', tableName);
        console.error('Data:', data);
        throw error;
    }
}

// Delete and get affected rows
export async function deleteRecord(tableName, id) {
    try {
        const sql = `DELETE FROM ${tableName} WHERE id = ?`;
        const [result] = await pool.execute(sql, [id]);
        return result.affectedRows;
    } catch (error) {
        console.error('Delete error:', error.message);
        console.error('Table:', tableName);
        console.error('ID:', id);
        throw error;
    }
}

// Transaction support
export async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Close pool
export async function closePool() {
    await pool.end();
}

export default pool;
