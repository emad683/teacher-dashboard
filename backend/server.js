const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey12345'; // Use env variable in production

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
const pool = require('./db/postgres');

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// --- Routes ---

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        if (user.is_active === false) {
            return res.status(403).json({ error: 'تم إيقاف هذا الحساب مؤقتاً. يرجى مراجعة الإدارة.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        } const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role, is_active FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Create user
app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'user';

    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const hash = bcrypt.hashSync(password, 10);
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
            [username, hash, userRole]
        );
        res.status(201).json({ id: result.rows[0].id, username, role: userRole });
    } catch (err) {
        if (err.code === '23505') { // UNIQUE violation in pg
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Update user
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'user';

    try {
        if (password) {
            const hash = bcrypt.hashSync(password, 10);
            await pool.query(
                'UPDATE users SET username = $1, password = $2, role = $3 WHERE id = $4',
                [username, hash, userRole, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET username = $1, role = $2 WHERE id = $3',
                [username, userRole, id]
            );
        }
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    // Don't allow deleting self
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        // Reset sequence to current max ID so deleting the last user frees up its ID
        await pool.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM users;`);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// User: Get Data
app.get('/api/user/data', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM user_data WHERE user_id = $1', [req.user.id]);
        const row = result.rows[0];
        if (row && row.data) {
            res.json(JSON.parse(row.data));
        } else {
            res.json(null);
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// User: Save Data
app.post('/api/user/data', authenticateToken, async (req, res) => {
    const data = JSON.stringify(req.body);
    
    try {
        const result = await pool.query('SELECT user_id FROM user_data WHERE user_id = $1', [req.user.id]);
        
        if (result.rows.length > 0) {
            await pool.query('UPDATE user_data SET data = $1 WHERE user_id = $2', [data, req.user.id]);
            res.json({ message: 'Data updated successfully' });
        } else {
            await pool.query('INSERT INTO user_data (user_id, data) VALUES ($1, $2)', [req.user.id, data]);
            res.json({ message: 'Data created successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Toggle user active status
app.put('/api/admin/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'لا يمكنك إيقاف حسابك الخاص' });
    }

    try {
        await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
        res.json({ message: 'User status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin Dashboard Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Start Server or Export for Serverless
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
