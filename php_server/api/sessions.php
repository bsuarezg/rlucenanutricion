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
    $stmt = $db->query('
        SELECT s.*, p.name as patient_name
        FROM sessions s
        LEFT JOIN patients p ON s.patient_id = p.id
        ORDER BY s.date DESC
    ');
    $sessions = [];
    while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
        $row['data'] = json_decode($row['data'], true);

        $mStmt = $db->prepare('SELECT * FROM session_measurements WHERE session_id = :id');
        $mStmt->bindValue(':id', $row['id'], SQLITE3_INTEGER);
        $mResult = $mStmt->execute();
        $measurements = [];
        while ($mRow = $mResult->fetchArray(SQLITE3_ASSOC)) {
            $measurements[] = $mRow;
        }
        $row['measurements'] = $measurements;

        $fStmt = $db->prepare('SELECT * FROM session_formula_results WHERE session_id = :id');
        $fStmt->bindValue(':id', $row['id'], SQLITE3_INTEGER);
        $fResult = $fStmt->execute();
        $formulas = [];
        while ($fRow = $fResult->fetchArray(SQLITE3_ASSOC)) {
            $formulas[] = $fRow;
        }
        $row['formulas_results'] = $formulas;

        $sessions[] = $row;
    }
    echo json_encode($sessions, JSON_UNESCAPED_UNICODE);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['patient_id']) || !isset($data['type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID and type are required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $db->exec('BEGIN TRANSACTION');
    try {
        $stmt = $db->prepare('INSERT INTO sessions (patient_id, notes, type, data) VALUES (:patient_id, :notes, :type, :data)');
        $stmt->bindValue(':patient_id', $data['patient_id'], SQLITE3_INTEGER);
        $stmt->bindValue(':notes', $data['notes'] ?? '', SQLITE3_TEXT);
        $stmt->bindValue(':type', $data['type'], SQLITE3_TEXT);
        $stmt->bindValue(':data', json_encode($data['data'] ?? []), SQLITE3_TEXT, JSON_UNESCAPED_UNICODE);
        $stmt->execute();
        $id = $db->lastInsertRowID();

        if (isset($data['measurements']) && is_array($data['measurements'])) {
            $mStmt = $db->prepare('INSERT INTO session_measurements (session_id, measurement_type, value1, value2, value3, final_value) VALUES (:session_id, :type, :v1, :v2, :v3, :fv)');
            foreach ($data['measurements'] as $m) {
                if (empty($m['type'])) continue;
                $mStmt->bindValue(':session_id', $id, SQLITE3_INTEGER);
                $mStmt->bindValue(':type', $m['type'], SQLITE3_TEXT);
                $mStmt->bindValue(':v1', isset($m['value1']) && $m['value1'] !== '' ? floatval($m['value1']) : null, SQLITE3_FLOAT);
                $mStmt->bindValue(':v2', isset($m['value2']) && $m['value2'] !== '' ? floatval($m['value2']) : null, SQLITE3_FLOAT);
                $mStmt->bindValue(':v3', isset($m['value3']) && $m['value3'] !== '' ? floatval($m['value3']) : null, SQLITE3_FLOAT);
                $mStmt->bindValue(':fv', isset($m['final_value']) && $m['final_value'] !== '' ? floatval($m['final_value']) : null, SQLITE3_FLOAT);
                $mStmt->execute();
            }
        }

        if (isset($data['formulas_results']) && is_array($data['formulas_results'])) {
            $fStmt = $db->prepare('INSERT INTO session_formula_results (session_id, formula_name, formula_expression, result_value) VALUES (:session_id, :name, :expr, :val)');
            foreach ($data['formulas_results'] as $f) {
                $fStmt->bindValue(':session_id', $id, SQLITE3_INTEGER);
                $fStmt->bindValue(':name', $f['formula_name'] ?? 'Unknown', SQLITE3_TEXT);
                $fStmt->bindValue(':expr', $f['formula_expression'] ?? '', SQLITE3_TEXT);
                $fStmt->bindValue(':val', isset($f['result_value']) && $f['result_value'] !== '' ? floatval($f['result_value']) : null, SQLITE3_FLOAT);
                $fStmt->execute();
            }
        }

        $db->exec('COMMIT');
        echo json_encode(['id' => $id, 'success' => true], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        $db->exec('ROLLBACK');
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}
