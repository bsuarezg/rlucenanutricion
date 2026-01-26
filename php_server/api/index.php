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
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove trailing slash
$uri = rtrim($uri, '/');

// Extract resource name (e.g. /api/patients -> patients)
// Assuming URI starts with /api/
if (strpos($uri, '/api/') !== 0) {
    // If we are serving from root (e.g. php -S localhost:3001)
    // and the request doesn't start with /api, something is wrong or it's static file
    // return false to let built-in server handle it if file exists
    if (file_exists($_SERVER['SCRIPT_FILENAME']) && $_SERVER['SCRIPT_FILENAME'] != __FILE__) {
        return false;
    }
}

$path = str_replace('/api/', '', $uri);
$parts = explode('/', $path);

$resource = $parts[0];
$id = isset($parts[1]) && is_numeric($parts[1]) ? $parts[1] : null;

if ($id) {
    $_GET['id'] = $id;
}

$file = __DIR__ . '/' . $resource . '.php';

if (file_exists($file)) {
    require $file;
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found', 'uri' => $uri]);
}
?>
