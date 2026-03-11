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
    $stmt = $db->query('SELECT * FROM templates ORDER BY created_at DESC');
    $templates = [];
    while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
        $row['fields'] = json_decode($row['fields'], true);
        $templates[] = $row;
    }
    echo json_encode($templates);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['name']) || !isset($data['type']) || !isset($data['fields'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, type, and fields are required']);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO templates (name, type, fields) VALUES (:name, :type, :fields)');
    $stmt->bindValue(':name', $data['name'], SQLITE3_TEXT);
    $stmt->bindValue(':type', $data['type'], SQLITE3_TEXT);
    $stmt->bindValue(':fields', json_encode($data['fields']), SQLITE3_TEXT);

    try {
        $stmt->execute();
        $id = $db->lastInsertRowID();
        echo json_encode(['id' => $id, 'name' => $data['name']]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $parts = explode('/', $uri);
    $id = end($parts);

    if (!is_numeric($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID']);
        exit();
    }

    $stmt = $db->prepare('DELETE FROM templates WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();

    echo json_encode(['success' => true]);
}
