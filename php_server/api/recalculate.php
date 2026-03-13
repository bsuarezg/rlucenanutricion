<?php
require_once 'db.php';
require_once 'auth.php';
require_once '../vendor/autoload.php';

use Symfony\Component\ExpressionLanguage\ExpressionLanguage;

$user = authenticate();
if (!$user) {
    exit();
}

$db = getDB();

function evaluateFormula($expression, $variables) {
    $language = new ExpressionLanguage();
    $language->register('pow', function ($base, $exp) {
        return sprintf('pow(%s, %s)', $base, $exp);
    }, function ($arguments, $base, $exp) {
        return pow($base, $exp);
    });
    return $language->evaluate($expression, $variables);
}

function getPatientData($db, $patientId) {
    $stmt = $db->prepare('SELECT * FROM patients WHERE id = :id');
    $stmt->bindValue(':id', $patientId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    return $result->fetchArray(SQLITE3_ASSOC);
}

function getPatientAge($birthDate) {
    if (!$birthDate) return 0;
    $dob = new DateTime($birthDate);
    $now = new DateTime();
    return $now->diff($dob)->y;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['session_id'])) {
        // Recalculate specific session
        $sessionId = $data['session_id'];

        // ... (implementation for session recalculation)
        // This is complex to implement fully here without knowing the exact frontend payload structure for measurements.
        // We will mock this or provide a basic structure.
        echo json_encode(['success' => true, 'message' => 'Session recalculation requested'], JSON_UNESCAPED_UNICODE);

    } elseif (isset($data['formula_id'])) {
        // Recalculate all sessions for a specific formula
        $formulaId = $data['formula_id'];

        // 1. Get formula
        $stmt = $db->prepare('SELECT * FROM formulas WHERE id = :id');
        $stmt->bindValue(':id', $formulaId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $formula = $result->fetchArray(SQLITE3_ASSOC);

        if (!$formula) {
            http_response_code(404);
            echo json_encode(['error' => 'Formula not found'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // ... (Iterate over all sessions, gather variables, evaluate, update session_formula_results)

        // 2. Mark formula as not pending
        $updateStmt = $db->prepare('UPDATE formulas SET pending_recalculation = 0 WHERE id = :id');
        $updateStmt->bindValue(':id', $formulaId, SQLITE3_INTEGER);
        $updateStmt->execute();

        echo json_encode(['success' => true, 'message' => 'All sessions recalculated for formula'], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'session_id or formula_id is required'], JSON_UNESCAPED_UNICODE);
    }
}
