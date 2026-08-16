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

        // Create default admin if not exists
        const res = await pool.query("SELECT id FROM users WHERE username = 'admin'");
        if (res.rows.length === 0) {
            const hash = bcrypt.hashSync('admin', 10);
            await pool.query(
                "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
                ['admin', hash, 'admin']
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
