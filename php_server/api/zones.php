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
    echo json_encode(['error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
    exit();
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query('SELECT * FROM zones');
    $zones = [];
    while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
        $zones[] = $row;
    }
    echo json_encode($zones, JSON_UNESCAPED_UNICODE);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['value']) || !isset($data['label'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Value and label are required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO zones (value, label) VALUES (:value, :label)');
    $stmt->bindValue(':value', $data['value'], SQLITE3_TEXT);
    $stmt->bindValue(':label', $data['label'], SQLITE3_TEXT);

    try {
        $stmt->execute();
        $id = $db->lastInsertRowID();
        echo json_encode(['id' => $id, 'value' => $data['value'], 'label' => $data['label']], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $parts = explode('/', $uri);
    $id = end($parts);

    if (!is_numeric($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt = $db->prepare('DELETE FROM zones WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();

    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
}
