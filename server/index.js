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
    const { patient_id } = req.query;
    let query = `
        SELECT s.*, p.name as patient_name,
               (SELECT json_group_array(json_object(
                   'id', sm.id,
                   'measurement_type', sm.measurement_type,
                   'value1', sm.value1,
                   'value2', sm.value2,
                   'value3', sm.value3,
                   'final_value', sm.final_value
               )) FROM session_measurements sm WHERE sm.session_id = s.id) as measurements,
               (SELECT json_group_array(json_object(
                   'id', sfr.id,
                   'formula_id', sfr.formula_id,
                   'result_value', sfr.result_value,
                   'is_outdated', sfr.is_outdated
               )) FROM session_formula_results sfr WHERE sfr.session_id = s.id) as formulas_results
        FROM sessions s
        LEFT JOIN patients p ON s.patient_id = p.id
    `;
    const params = [];

    if (patient_id) {
        query += ' WHERE s.patient_id = ? ';
        params.push(patient_id);
    }

    query += ' ORDER BY s.date DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Parse the JSON string columns back to arrays
        const parsedRows = rows.map(row => {
            let measurements = [];
            let formulasResults = [];
            try { measurements = JSON.parse(row.measurements || '[]'); } catch (e) {}
            try { formulasResults = JSON.parse(row.formulas_results || '[]'); } catch (e) {}
            return {
                ...row,
                measurements: measurements.filter(m => m.id !== null), // SQLite json_group_array might return [ {id: null, ...} ] if empty
                formulas_results: formulasResults.filter(f => f.id !== null)
            };
        });

        res.json(parsedRows);
    });
});

app.post('/api/sessions', authenticateToken, (req, res) => {
    const { patient_id, notes, type, data, measurements, formulas_results } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
            INSERT INTO sessions (patient_id, notes, type, data)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run([patient_id, notes, type, JSON.stringify(data || {})], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const sessionId = this.lastID;

            if (measurements && measurements.length > 0) {
                const mStmt = db.prepare(`
                    INSERT INTO session_measurements (session_id, measurement_type, value1, value2, value3, final_value)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                measurements.forEach(m => {
                    mStmt.run([sessionId, m.measurement_type, m.value1, m.value2, m.value3, m.final_value]);
                });
                mStmt.finalize();
            }

            if (formulas_results && formulas_results.length > 0) {
                const fStmt = db.prepare(`
                    INSERT INTO session_formula_results (session_id, formula_id, result_value, is_outdated)
                    VALUES (?, ?, ?, 0)
                `);
                formulas_results.forEach(f => {
                    fStmt.run([sessionId, f.formula_id, f.result_value]);
                });
                fStmt.finalize();
            }

            db.run('COMMIT', (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: sessionId, ...req.body });
            });
        });
    });
});

const math = require('mathjs');

// Evaluation endpoint
app.post('/api/evaluate', authenticateToken, (req, res) => {
    const { expression, variables } = req.body;
    if (!expression || !variables) {
        return res.status(400).json({ error: 'Expression and variables are required' });
    }

    try {
        const result = math.evaluate(expression, variables);
        res.json({ result });
    } catch (err) {
        res.status(400).json({ error: 'Evaluation error: ' + err.message });
    }
});

// Recalculation endpoints
app.post('/api/recalculate', authenticateToken, (req, res) => {
    const { session_id, formula_id } = req.body;

    if (session_id) {
        res.json({ success: true, message: 'Session recalculation requested (mock)' });
    } else if (formula_id) {
        db.run('UPDATE formulas SET pending_recalculation = 0 WHERE id = ?', [formula_id], function(err) {
             if (err) return res.status(500).json({ error: err.message });
             res.json({ success: true, message: 'All sessions recalculated for formula' });
        });
    } else {
        res.status(400).json({ error: 'session_id or formula_id is required' });
    }
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

// Settings endpoints
app.get('/api/settings', authenticateToken, (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    });
});

app.post('/api/settings', authenticateToken, (req, res) => {
    const data = req.body;

    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
            INSERT INTO settings (setting_key, setting_value)
            VALUES (?, ?)
            ON CONFLICT(setting_key)
            DO UPDATE SET setting_value = excluded.setting_value
        `);

        for (const [key, value] of Object.entries(data)) {
            const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
            stmt.run([key, val]);
        }
        stmt.finalize();

        db.run('COMMIT', (err) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            // Return updated settings
            db.all('SELECT * FROM settings', [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                const settings = {};
                rows.forEach(row => {
                    settings[row.setting_key] = row.setting_value;
                });
                res.json(settings);
            });
        });
    });
});

// Formulas endpoints
app.get('/api/formulas', authenticateToken, (req, res) => {
    const { pending } = req.query;
    let query = 'SELECT * FROM formulas ORDER BY name ASC';
    if (pending === 'true') {
        query = 'SELECT * FROM formulas WHERE pending_recalculation = 1 ORDER BY name ASC';
    }

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/formulas', authenticateToken, (req, res) => {
    const { name, expression, pending_recalculation } = req.body;
    if (!name || !expression) {
        return res.status(400).json({ error: 'Name and expression are required' });
    }

    const pending = pending_recalculation ? 1 : 0;
    const stmt = db.prepare('INSERT INTO formulas (name, expression, pending_recalculation) VALUES (?, ?, ?)');

    stmt.run([name, expression, pending], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, expression, pending_recalculation: pending });
    });
});

app.put('/api/formulas/:id', authenticateToken, (req, res) => {
    const { name, expression, pending_recalculation } = req.body;
    if (!name || !expression) {
        return res.status(400).json({ error: 'Name and expression are required' });
    }

    const pending = pending_recalculation !== undefined ? (pending_recalculation ? 1 : 0) : 1;
    const stmt = db.prepare('UPDATE formulas SET name = ?, expression = ?, pending_recalculation = ? WHERE id = ?');

    stmt.run([name, expression, pending, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: req.params.id, name, expression, pending_recalculation: pending });
    });
});

app.delete('/api/formulas/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM formulas WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// Constants endpoints
app.get('/api/constants', authenticateToken, (req, res) => {
    db.all('SELECT * FROM constant_groups ORDER BY name ASC', [], (err, groups) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all('SELECT * FROM constant_values ORDER BY group_id, gender, age_min', [], (err, values) => {
            if (err) return res.status(500).json({ error: err.message });

            const result = groups.map(group => {
                return {
                    ...group,
                    values: values.filter(v => v.group_id === group.id)
                };
            });
            res.json(result);
        });
    });
});

app.post('/api/constants', authenticateToken, (req, res) => {
    const { name, values } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare('INSERT INTO constant_groups (name) VALUES (?)');

        stmt.run([name], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const groupId = this.lastID;

            if (values && values.length > 0) {
                const vStmt = db.prepare('INSERT INTO constant_values (group_id, gender, age_min, age_max, value) VALUES (?, ?, ?, ?, ?)');
                for (const val of values) {
                    vStmt.run([groupId, val.gender || null, val.age_min || null, val.age_max || null, val.value]);
                }
                vStmt.finalize();
            }

            db.run('COMMIT', (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: groupId, name, values: values || [] });
            });
        });
    });
});

app.put('/api/constants/:id', authenticateToken, (req, res) => {
    const { name, values } = req.body;
    const id = req.params.id;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run('UPDATE constant_groups SET name = ? WHERE id = ?', [name, id], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            db.run('DELETE FROM constant_values WHERE group_id = ?', [id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                if (values && values.length > 0) {
                    const vStmt = db.prepare('INSERT INTO constant_values (group_id, gender, age_min, age_max, value) VALUES (?, ?, ?, ?, ?)');
                    for (const val of values) {
                        vStmt.run([id, val.gender || null, val.age_min || null, val.age_max || null, val.value]);
                    }
                    vStmt.finalize();
                }

                db.run('COMMIT', (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id, name, values: values || [] });
                });
            });
        });
    });
});

app.delete('/api/constants/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM constant_groups WHERE id = ?', req.params.id, function(err) {
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
