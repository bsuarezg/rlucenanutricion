<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'auth.php';
require_once 'db.php';

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query('
        SELECT s.*, p.name as patient_name
        FROM sessions s
        LEFT JOIN patients p ON s.patient_id = p.id
        ORDER BY s.date DESC
    ');
    $sessions = [];
    while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
        $row['data'] = json_decode($row['data'], true);
        $sessions[] = $row;
    }
    echo json_encode($sessions);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['patient_id']) || !isset($data['type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID and type are required']);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO sessions (patient_id, notes, type, data) VALUES (:patient_id, :notes, :type, :data)');
    $stmt->bindValue(':patient_id', $data['patient_id'], SQLITE3_INTEGER);
    $stmt->bindValue(':notes', $data['notes'] ?? '', SQLITE3_TEXT);
    $stmt->bindValue(':type', $data['type'], SQLITE3_TEXT);
    $stmt->bindValue(':data', json_encode($data['data'] ?? []), SQLITE3_TEXT);

    try {
        $stmt->execute();
        $id = $db->lastInsertRowID();
        echo json_encode(['id' => $id, 'success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
