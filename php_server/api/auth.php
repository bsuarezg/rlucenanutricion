<?php
function generateToken($payload) {
    $secret_key = 'super_secret_key_change_in_production';
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['exp'] = time() + (8 * 60 * 60); // 8 hours
    $payload = json_encode($payload);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret_key, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken($token) {
    $secret_key = 'super_secret_key_change_in_production';
    $parts = explode('.', $token);
    if (count($parts) != 3) return false;

    $header = $parts[0];
    $payload = $parts[1];
    $signatureProvided = $parts[2];

    $signature = hash_hmac('sha256', $header . "." . $payload, $secret_key, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if ($base64UrlSignature === $signatureProvided) {
        $data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        if ($data['exp'] < time()) return false;
        return $data;
    }
    return false;
}

function authenticate() {
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = trim($headers['Authorization']);
        }
    }

    if (empty($authHeader)) {
        return false;
    }

    $token = str_replace('Bearer ', '', $authHeader);
    return verifyToken($token);
}
?>
