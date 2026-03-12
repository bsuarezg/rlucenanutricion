<?php
require_once 'db.php';
require_once 'auth.php';

$user = authenticate();
if (!$user) {
    exit();
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Return all settings
    $stmt = $db->prepare('SELECT * FROM settings');
    $result = $stmt->execute();

    $settings = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    echo json_encode($settings);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update or insert settings
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
        exit();
    }

    $db->exec('BEGIN TRANSACTION');

    try {
        $stmt = $db->prepare('
            INSERT INTO settings (setting_key, setting_value)
            VALUES (:key, :value)
            ON CONFLICT(setting_key)
            DO UPDATE SET setting_value = :value
        ');

        foreach ($data as $key => $value) {
            $stmt->bindValue(':key', $key, SQLITE3_TEXT);
            $stmt->bindValue(':value', is_array($value) ? json_encode($value) : $value, SQLITE3_TEXT);
            $stmt->execute();
        }

        $db->exec('COMMIT');

        // Fetch and return the updated settings
        $result = $db->query('SELECT * FROM settings');
        $updatedSettings = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $updatedSettings[$row['setting_key']] = $row['setting_value'];
        }

        echo json_encode($updatedSettings);
    } catch (Exception $e) {
        $db->exec('ROLLBACK');
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
