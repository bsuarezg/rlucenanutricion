<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function getDB() {
    $dbPath = __DIR__ . '/db/nutrition.db';
    $dir = dirname($dbPath);

    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }

    $db = new SQLite3($dbPath);
    $db->busyTimeout(5000);

    // Enable foreign keys
    $db->exec('PRAGMA foreign_keys = ON;');

    // Create tables if they don't exist
    $db->exec('
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );

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
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            type TEXT,
            data TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS session_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            measurement_type TEXT NOT NULL,
            value1 REAL,
            value2 REAL,
            value3 REAL,
            final_value REAL,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT NOT NULL UNIQUE,
            setting_value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS formulas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            expression TEXT NOT NULL,
            pending_recalculation BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS constant_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS constant_values (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            gender TEXT,
            age_min INTEGER,
            age_max INTEGER,
            value REAL NOT NULL,
            FOREIGN KEY (group_id) REFERENCES constant_groups(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS session_formula_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            formula_id INTEGER NOT NULL,
            result_value REAL,
            is_outdated BOOLEAN DEFAULT 0,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            fields TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            value TEXT NOT NULL UNIQUE,
            label TEXT NOT NULL
        );
    ');

    // Create default user if not exists
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM users');
    $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if ($result['count'] == 0) {
        $stmt = $db->prepare('INSERT INTO users (username, password) VALUES (:username, :password)');
        $stmt->bindValue(':username', 'rlucena', SQLITE3_TEXT);
        // Password is 'Gilb3rt01+'
        $stmt->bindValue(':password', password_hash('Gilb3rt01+', PASSWORD_DEFAULT), SQLITE3_TEXT);
        $stmt->execute();
    }

    // Seed zones if table is empty
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM zones');
    $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if ($result['count'] == 0) {
        $default_zones = [
            ['value' => 'torso', 'label' => 'Torso'],
            ['value' => 'piernas', 'label' => 'Piernas'],
            ['value' => 'brazos', 'label' => 'Brazos'],
            ['value' => 'cabeza', 'label' => 'Cabeza'],
            ['value' => 'cuello', 'label' => 'Cuello']
        ];

        $stmt = $db->prepare('INSERT INTO zones (value, label) VALUES (:value, :label)');
        foreach ($default_zones as $zone) {
            $stmt->bindValue(':value', $zone['value'], SQLITE3_TEXT);
            $stmt->bindValue(':label', $zone['label'], SQLITE3_TEXT);
            $stmt->execute();
        }
    }

    return $db;
}
