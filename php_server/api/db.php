<?php
class DB {
    private $pdo;

    public function __construct() {
        $dbDir = __DIR__ . '/db';
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0777, true);
        }
        $dbPath = $dbDir . '/nutrition.db';
        $this->pdo = new PDO("sqlite:" . $dbPath);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->initDb();
    }

    public function getPdo() {
        return $this->pdo;
    }

    private function initDb() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT
        )");

        $this->pdo->exec("CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dni TEXT,
            dob TEXT,
            email TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
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
        )");

        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id)");

        $this->pdo->exec("CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            fields TEXT NOT NULL
        )");

        // Admin user creation
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute(['rlucena']);
        if (!$stmt->fetch()) {
             $hash = password_hash('Gilb3rt01+', PASSWORD_DEFAULT);
             $stmt = $this->pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
             $stmt->execute(['rlucena', $hash]);
        }
    }
}
?>
