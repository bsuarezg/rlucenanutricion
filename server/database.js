const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'nutrition.db');
const db = new sqlite3.Database(dbPath);

const initDb = async () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dni TEXT,
            dob TEXT,
            email TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            date TEXT,
            place TEXT,
            type TEXT,
            price REAL,
            attended INTEGER DEFAULT 1,
            clinical_data TEXT,
            formula_data TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            fields TEXT NOT NULL
        )`);

        const adminUser = 'rlucena';
        const adminPass = 'Gilb3rt01+';

        db.get("SELECT * FROM users WHERE username = ?", [adminUser], async (err, row) => {
            if (err) {
                console.error("Error checking for admin user:", err);
                return;
            }
            if (!row) {
                const hash = await bcrypt.hash(adminPass, 10);
                db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [adminUser, hash], (err) => {
                    if (err) console.error("Error creating admin user:", err);
                    else console.log("Admin user created.");
                });
            } else {
                console.log("Admin user already exists.");
            }
        });
    });
};

module.exports = { db, initDb };
