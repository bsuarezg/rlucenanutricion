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
        $stmt = $pdo->query("SELECT * FROM templates");
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($templates as &$template) {
            $template['fields'] = json_decode($template['fields'] ?: '[]', true);
        }
        echo json_encode($templates);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO templates (name, type, fields) VALUES (?, ?, ?)");
        try {
            $stmt->execute([
                $data['name'],
                $data['type'],
                json_encode($data['fields'])
            ]);
            $data['id'] = $pdo->lastInsertId();
            echo json_encode($data);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            break;
        }
        $stmt = $pdo->prepare("DELETE FROM templates WHERE id = ?");
        try {
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>
