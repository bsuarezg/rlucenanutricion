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
    $stmt = $db->query('SELECT * FROM patients ORDER BY created_at DESC');
    $patients = [];
    while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
        $patients[] = $row;
    }
    echo json_encode($patients, JSON_UNESCAPED_UNICODE);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt = $db->prepare('INSERT INTO patients (name, email, phone, dni, birth_date, gender, notes) VALUES (:name, :email, :phone, :dni, :birth_date, :gender, :notes)');
    $stmt->bindValue(':name', $data['name'], SQLITE3_TEXT);
    $stmt->bindValue(':email', $data['email'] ?? '', SQLITE3_TEXT);
    $stmt->bindValue(':phone', $data['phone'] ?? '', SQLITE3_TEXT);
    $stmt->bindValue(':dni', $data['dni'] ?? '', SQLITE3_TEXT);
    $stmt->bindValue(':birth_date', $data['birth_date'] ?? null, SQLITE3_TEXT);
    $stmt->bindValue(':gender', $data['gender'] ?? '', SQLITE3_TEXT);
    $stmt->bindValue(':notes', $data['notes'] ?? '', SQLITE3_TEXT);

    try {
        $stmt->execute();
        $id = $db->lastInsertRowID();
        echo json_encode(['id' => $id, 'name' => $data['name']], JSON_UNESCAPED_UNICODE);
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

    $stmt = $db->prepare('DELETE FROM patients WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();

    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
}
