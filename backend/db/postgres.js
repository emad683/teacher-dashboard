const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initDB = async () => {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            )
        `);

        // Create user_data table to store JSON state for each user
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_data (
                user_id INTEGER PRIMARY KEY,
                data TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check if is_active column exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' and column_name='is_active'
        `);
        if(columnCheck.rows.length === 0) {
            await pool.query("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true");
            console.log("Added is_active column to users table.");
        }

        // Create default admin if NO ADMIN exists
        const res = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        if (res.rows.length === 0) {
            const hash = bcrypt.hashSync('admin', 10);
            await pool.query(
                "INSERT INTO users (username, password, role, is_active) VALUES ($1, $2, $3, $4)",
                ['admin', hash, 'admin', true]
            );
            console.log("Default admin account created (admin/admin)");
        }
        
        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

initDB();

module.exports = pool;
