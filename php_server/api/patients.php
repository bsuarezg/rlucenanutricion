<?php
require_once 'db.php';
require_once 'auth.php';

$auth = new Auth();
$user = $auth->authenticate();

$db = new DB();
$pdo = $db->getPdo();

$method = $_SERVER['REQUEST_METHOD'];
// id comes from the router via $_GET['id']

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM patients ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO patients (name, dni, dob, email, phone) VALUES (?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$data['name'], $data['dni'], $data['dob'], $data['email'], $data['phone']]);
            $data['id'] = $pdo->lastInsertId();
            echo json_encode($data);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            break;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE patients SET name = ?, dni = ?, dob = ?, email = ?, phone = ? WHERE id = ?");
        try {
            $stmt->execute([$data['name'], $data['dni'], $data['dob'], $data['email'], $data['phone'], $id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>
