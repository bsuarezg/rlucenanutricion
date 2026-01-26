<?php
require_once 'db.php';
require_once 'auth.php';

$auth = new Auth();
$user = $auth->authenticate();

$db = new DB();
$pdo = $db->getPdo();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $patient_id = isset($_GET['patient_id']) ? $_GET['patient_id'] : null;
        $sql = "SELECT * FROM sessions";
        $params = [];
        if ($patient_id) {
            $sql .= " WHERE patient_id = ?";
            $params[] = $patient_id;
        }
        $sql .= " ORDER BY date DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields
        foreach ($sessions as &$session) {
            $session['clinical_data'] = json_decode($session['clinical_data'] ?: '{}', true);
            $session['formula_data'] = json_decode($session['formula_data'] ?: '{}', true);
            // Convert attended to boolean for React
            $session['attended'] = (bool)$session['attended'];
        }
        echo json_encode($sessions);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $sql = "INSERT INTO sessions (patient_id, date, place, type, price, attended, clinical_data, formula_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['patient_id'],
                $data['date'],
                $data['place'],
                $data['type'],
                $data['price'],
                $data['attended'] ? 1 : 0,
                json_encode($data['clinical_data']),
                json_encode($data['formula_data'])
            ]);
            $data['id'] = $pdo->lastInsertId();
            echo json_encode($data);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>
