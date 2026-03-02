const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const DB_PATH = path.resolve(__dirname, 'benchmark.db');

// Clean up old DB
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

const NUM_PATIENTS = 100;
const NUM_SESSIONS = 10000;
const NUM_QUERIES = 1000;

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function setup() {
    console.log('Setting up database...');
    await runQuery(`CREATE TABLE patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
    )`);

    // No index initially
    await runQuery(`CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        price REAL,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);

    console.log(`Seeding ${NUM_PATIENTS} patients...`);

    await new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmt = db.prepare("INSERT INTO patients (name) VALUES (?)");
            for (let i = 0; i < NUM_PATIENTS; i++) {
                stmt.run(`Patient ${i}`);
            }
            stmt.finalize();
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    console.log(`Seeding ${NUM_SESSIONS} sessions...`);

    await new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmt = db.prepare("INSERT INTO sessions (patient_id, price) VALUES (?, ?)");
            for (let i = 0; i < NUM_SESSIONS; i++) {
                const pid = Math.floor(Math.random() * NUM_PATIENTS) + 1;
                stmt.run(pid, Math.random() * 100);
            }
            stmt.finalize();
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

async function benchmark(label) {
    console.log(`Benchmarking ${label}...`);
    const start = performance.now();
    for (let i = 0; i < NUM_QUERIES; i++) {
        const pid = Math.floor(Math.random() * NUM_PATIENTS) + 1;
        await getQuery("SELECT * FROM sessions WHERE patient_id = ?", [pid]);
    }
    const end = performance.now();
    const duration = end - start;
    console.log(`${label} Duration: ${duration.toFixed(2)}ms for ${NUM_QUERIES} queries`);
    return duration;
}

async function main() {
    await setup();

    const baseline = await benchmark("Baseline (No Index)");

    console.log('Adding Index...');
    await runQuery("CREATE INDEX idx_sessions_patient_id ON sessions(patient_id)");

    const optimized = await benchmark("Optimized (With Index)");

    console.log('--------------------------------------------------');
    console.log(`Improvement: ${(baseline / optimized).toFixed(2)}x faster`);
    console.log('--------------------------------------------------');

    db.close();
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
    }
}

main().catch(console.error);
