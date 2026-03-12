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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['expression']) || !isset($data['variables'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Expression and variables are required']);
        exit();
    }

    try {
        $language = new ExpressionLanguage();
        // Register some custom math functions if needed
        $language->register('pow', function ($base, $exp) {
            return sprintf('pow(%s, %s)', $base, $exp);
        }, function ($arguments, $base, $exp) {
            return pow($base, $exp);
        });

        $result = $language->evaluate($data['expression'], $data['variables']);
        echo json_encode(['result' => $result]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Evaluation error: ' . $e->getMessage()]);
    }
}
