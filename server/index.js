const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, initDb } = require('./database');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'super_secret_key_change_in_production';

app.use(cors());
app.use(express.json());

initDb();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '8h' });
            res.json({ token, user: { username: user.username } });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

app.get('/api/patients', authenticateToken, (req, res) => {
    db.all("SELECT * FROM patients ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patients', authenticateToken, (req, res) => {
    const { name, dni, dob, email, phone } = req.body;
    const sql = "INSERT INTO patients (name, dni, dob, email, phone) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [name, dni, dob, email, phone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/patients/:id', authenticateToken, (req, res) => {
    const { name, dni, dob, email, phone } = req.body;
    const sql = "UPDATE patients SET name = ?, dni = ?, dob = ?, email = ?, phone = ? WHERE id = ?";
    db.run(sql, [name, dni, dob, email, phone, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/sessions', authenticateToken, (req, res) => {
    const { patient_id } = req.query;
    let sql = "SELECT * FROM sessions";
    let params = [];
    if (patient_id) {
        sql += " WHERE patient_id = ?";
        params.push(patient_id);
    }
    sql += " ORDER BY date DESC";
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const sessions = rows.map(row => ({
            ...row,
            clinical_data: JSON.parse(row.clinical_data || '{}'),
            formula_data: JSON.parse(row.formula_data || '{}')
        }));
        res.json(sessions);
    });
});

app.post('/api/sessions', authenticateToken, (req, res) => {
    const { patient_id, date, place, type, price, attended, clinical_data, formula_data } = req.body;
    const sql = `INSERT INTO sessions (patient_id, date, place, type, price, attended, clinical_data, formula_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [
        patient_id, date, place, type, price, attended ? 1 : 0,
        JSON.stringify(clinical_data || {}), JSON.stringify(formula_data || {})
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.get('/api/templates', authenticateToken, (req, res) => {
    db.all("SELECT * FROM templates", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const templates = rows.map(row => ({
            ...row,
            fields: JSON.parse(row.fields || '[]')
        }));
        res.json(templates);
    });
});

app.post('/api/templates', authenticateToken, (req, res) => {
    const { name, type, fields } = req.body;
    const sql = "INSERT INTO templates (name, type, fields) VALUES (?, ?, ?)";
    db.run(sql, [name, type, JSON.stringify(fields)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, type, fields });
    });
});

app.delete('/api/templates/:id', authenticateToken, (req, res) => {
    const sql = "DELETE FROM templates WHERE id = ?";
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
