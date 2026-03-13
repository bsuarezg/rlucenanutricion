<?php
require_once 'db.php';
require_once 'auth.php';

$user = authenticate();
if (!$user) {
    exit();
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $pending = isset($_GET['pending']) ? $_GET['pending'] === 'true' : false;

    if ($id) {
        $stmt = $db->prepare('SELECT * FROM formulas WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $formula = $result->fetchArray(SQLITE3_ASSOC);

        if ($formula) {
            echo json_encode($formula, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Formula not found'], JSON_UNESCAPED_UNICODE);
        }
    } else {
        $query = 'SELECT * FROM formulas ORDER BY name ASC';
        if ($pending) {
            $query = 'SELECT * FROM formulas WHERE pending_recalculation = 1 ORDER BY name ASC';
        }

        $result = $db->query($query);
        $formulas = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $formulas[] = $row;
        }
        echo json_encode($formulas, JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name']) || !isset($data['expression'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and expression are required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $pending = isset($data['pending_recalculation']) ? ($data['pending_recalculation'] ? 1 : 0) : 0;

    $stmt = $db->prepare('
        INSERT INTO formulas (name, expression, pending_recalculation)
        VALUES (:name, :expression, :pending)
    ');

    $stmt->bindValue(':name', $data['name'], SQLITE3_TEXT);
    $stmt->bindValue(':expression', $data['expression'], SQLITE3_TEXT);
    $stmt->bindValue(':pending', $pending, SQLITE3_INTEGER);

    try {
        $stmt->execute();
        $id = $db->lastInsertRowID();

        echo json_encode([
            'id' => $id,
            'name' => $data['name'],
            'expression' => $data['expression'],
            'pending_recalculation' => $pending
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name']) || !isset($data['expression'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and expression are required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $pending = isset($data['pending_recalculation']) ? ($data['pending_recalculation'] ? 1 : 0) : 1; // Default to true on edit

    $stmt = $db->prepare('
        UPDATE formulas
        SET name = :name, expression = :expression, pending_recalculation = :pending
        WHERE id = :id
    ');

    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->bindValue(':name', $data['name'], SQLITE3_TEXT);
    $stmt->bindValue(':expression', $data['expression'], SQLITE3_TEXT);
    $stmt->bindValue(':pending', $pending, SQLITE3_INTEGER);

    try {
        $stmt->execute();
        echo json_encode([
            'id' => $id,
            'name' => $data['name'],
            'expression' => $data['expression'],
            'pending_recalculation' => $pending
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt = $db->prepare('DELETE FROM formulas WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);

    try {
        $stmt->execute();
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}
