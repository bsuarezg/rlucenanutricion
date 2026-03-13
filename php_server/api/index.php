<?php
// Handle CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

// Router Logic
// For Apache with .htaccess pointing to this index.php
// The Request URI might be /api/patients or /subfolder/api/patients
// The simplest, most robust way is to just find the part after the last 'api/'
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Find the position of '/api/'
$apiPos = strpos($uri, '/api/');

if ($apiPos !== false) {
    $path = substr($uri, $apiPos + 5); // Length of '/api/'
} else {
    // Fallback if accessed directly as index.php/patients (unlikely if .htaccess works)
    $path = basename($uri);
    if ($path === 'index.php') {
        $path = '';
    }
}

$parts = explode('/', $path);

$resource = $parts[0];
$id = isset($parts[1]) && is_numeric($parts[1]) ? $parts[1] : null;

if ($id) {
    $_GET['id'] = $id;
}

if (empty($resource)) {
     echo json_encode(['status' => 'API is running'], JSON_UNESCAPED_UNICODE);
     exit;
}

$file = __DIR__ . '/' . $resource . '.php';

if (file_exists($file)) {
    require $file;
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found', 'uri' => $uri, 'resource' => $resource], JSON_UNESCAPED_UNICODE);
}
?>