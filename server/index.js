const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

// Patients endpoints
app.get('/api/patients', authenticateToken, (req, res) => {
    db.all('SELECT * FROM patients ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patients', authenticateToken, (req, res) => {
    const { name, email, phone, dni, birth_date, gender, notes } = req.body;
    const stmt = db.prepare(`
        INSERT INTO patients (name, email, phone, dni, birth_date, gender, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([name, email, phone, dni, birth_date, gender, notes], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/patients/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM patients WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// Sessions endpoints
app.get('/api/sessions', authenticateToken, (req, res) => {
    db.all(`
        SELECT s.*, p.name as patient_name
        FROM sessions s
        LEFT JOIN patients p ON s.patient_id = p.id
        ORDER BY s.date DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sessions', authenticateToken, (req, res) => {
    const { patient_id, notes, type, data } = req.body;
    const stmt = db.prepare(`
        INSERT INTO sessions (patient_id, notes, type, data)
        VALUES (?, ?, ?, ?)
    `);

    stmt.run([patient_id, notes, type, JSON.stringify(data)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// Templates endpoints
app.get('/api/templates', authenticateToken, (req, res) => {
    db.all('SELECT * FROM templates ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({
            ...row,
            fields: JSON.parse(row.fields)
        })));
    });
});

app.post('/api/templates', authenticateToken, (req, res) => {
    const { name, type, fields } = req.body;
    const stmt = db.prepare(`
        INSERT INTO templates (name, type, fields)
        VALUES (?, ?, ?)
    `);

    stmt.run([name, type, JSON.stringify(fields)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/templates/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM templates WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// Zones endpoints
app.get('/api/zones', authenticateToken, (req, res) => {
    db.all('SELECT * FROM zones', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/zones', authenticateToken, (req, res) => {
    const { value, label } = req.body;
    if (!value || !label) {
        return res.status(400).json({ error: 'Value and label are required' });
    }
    const stmt = db.prepare('INSERT INTO zones (value, label) VALUES (?, ?)');
    stmt.run([value, label], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, value, label });
    });
});

app.delete('/api/zones/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM zones WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
