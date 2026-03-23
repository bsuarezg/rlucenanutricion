<?php
require_once 'db.php';
require_once 'auth.php';
require_once '../vendor/autoload.php';
require_once 'evaluate.php';

use Symfony\Component\ExpressionLanguage\ExpressionLanguage;

$user = authenticate();
if (!$user) {
    exit();
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['session_id'])) {
        // Not currently used by frontend, but could recalculate single session
        $sessionId = $data['session_id'];
        echo json_encode(['success' => true, 'message' => 'Not implemented yet'], JSON_UNESCAPED_UNICODE);

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

        $expression = $formula['expression'];
        $formulaName = $formula['name'];

        // 2. Iterate over all sessions
        $sessionsResult = $db->query('SELECT id, patient_id FROM sessions');

        while ($session = $sessionsResult->fetchArray(SQLITE3_ASSOC)) {
            $sessionId = $session['id'];
            $patientId = $session['patient_id'];

            // Get Patient Data
            $patientStmt = $db->prepare('SELECT birth_date, gender FROM patients WHERE id = :id');
            $patientStmt->bindValue(':id', $patientId, SQLITE3_INTEGER);
            $patientRes = $patientStmt->execute();
            $patient = $patientRes->fetchArray(SQLITE3_ASSOC);

            $age = 0;
            $gender = 'M';
            if ($patient) {
                if ($patient['birth_date']) {
                    $dob = new DateTime($patient['birth_date']);
                    $now = new DateTime();
                    $age = $now->diff($dob)->y;
                }
                $gender = $patient['gender'] === 'Masculino' ? 'M' : 'F';
            }

            // Get Session Measurements (medians)
            $measStmt = $db->prepare('SELECT measurement_type, final_value FROM session_measurements WHERE session_id = :session_id');
            $measStmt->bindValue(':session_id', $sessionId, SQLITE3_INTEGER);
            $measRes = $measStmt->execute();

            $measurements = [];
            while ($meas = $measRes->fetchArray(SQLITE3_ASSOC)) {
                 $measurements[$meas['measurement_type']] = $meas['final_value'];
            }

            // Re-evaluate using the shared function
            try {
                $evalResult = evaluateFullExpression($db, $expression, $measurements, $age, $gender, $formulaId);

                // Update or Insert into session_formula_results
                $checkStmt = $db->prepare('SELECT id FROM session_formula_results WHERE session_id = :sid AND formula_id = :fid');
                $checkStmt->bindValue(':sid', $sessionId, SQLITE3_INTEGER);
                $checkStmt->bindValue(':fid', $formulaId, SQLITE3_INTEGER);
                $checkRes = $checkStmt->execute();

                if ($existing = $checkRes->fetchArray(SQLITE3_ASSOC)) {
                    $updStmt = $db->prepare('UPDATE session_formula_results SET result_value = :val, is_outdated = 0 WHERE id = :id');
                    $updStmt->bindValue(':val', $evalResult, SQLITE3_FLOAT);
                    $updStmt->bindValue(':id', $existing['id'], SQLITE3_INTEGER);
                    $updStmt->execute();
                } else {
                    $insStmt = $db->prepare('INSERT INTO session_formula_results (session_id, formula_id, result_value, is_outdated) VALUES (:sid, :fid, :val, 0)');
                    $insStmt->bindValue(':sid', $sessionId, SQLITE3_INTEGER);
                    $insStmt->bindValue(':fid', $formulaId, SQLITE3_INTEGER);
                    $insStmt->bindValue(':val', $evalResult, SQLITE3_FLOAT);
                    $insStmt->execute();
                }
            } catch (Exception $e) {
                // If a session fails, we log it but continue with others
                error_log("Failed to recalculate formula $formulaId for session $sessionId: " . $e->getMessage());
            }
        }

        // 3. Mark formula as not pending
        $updateStmt = $db->prepare('UPDATE formulas SET pending_recalculation = 0 WHERE id = :id');
        $updateStmt->bindValue(':id', $formulaId, SQLITE3_INTEGER);
        $updateStmt->execute();

        echo json_encode(['success' => true, 'message' => 'All sessions recalculated for formula'], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'session_id or formula_id is required'], JSON_UNESCAPED_UNICODE);
    }
}
