const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../php_server/api/db/nutrition.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');

        // Create tables
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                dni TEXT UNIQUE,
                birth_date DATE,
                gender TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                type TEXT,
                data TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS session_measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                measurement_type TEXT NOT NULL,
                value1 REAL,
                value2 REAL,
                value3 REAL,
                final_value REAL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT NOT NULL UNIQUE,
                setting_value TEXT NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS formulas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                expression TEXT NOT NULL,
                pending_recalculation BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS constant_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS constant_values (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                gender TEXT,
                age_min INTEGER,
                age_max INTEGER,
                value REAL NOT NULL,
                FOREIGN KEY (group_id) REFERENCES constant_groups(id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS session_formula_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                formula_id INTEGER NOT NULL,
                result_value REAL,
                is_outdated BOOLEAN DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                fields TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL
            )
        `);

        // Create default user if not exists
        db.get('SELECT COUNT(*) as count FROM users', [], async (err, row) => {
            if (err) return console.error(err);
            if (row.count === 0) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash('Gilb3rt01+', salt);
                db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['rlucena', hash]);
                console.log('Created default user');
            }
        });

        // Seed zones if table is empty
        db.get('SELECT COUNT(*) as count FROM zones', [], (err, row) => {
            if (err) return console.error(err);
            if (row.count === 0) {
                const stmt = db.prepare('INSERT INTO zones (value, label) VALUES (?, ?)');
                const defaultZones = [
                    { value: 'torso', label: 'Torso' },
                    { value: 'piernas', label: 'Piernas' },
                    { value: 'brazos', label: 'Brazos' },
                    { value: 'cabeza', label: 'Cabeza' },
                    { value: 'cuello', label: 'Cuello' }
                ];
                defaultZones.forEach(zone => {
                    stmt.run(zone.value, zone.label);
                });
                stmt.finalize();
                console.log('Created default zones');
            }
        });
    });
}

module.exports = db;
