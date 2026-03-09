<?php
class Auth {
    private $secret_key = 'super_secret_key_change_in_production';

    public function generateToken($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + (8 * 60 * 60); // 8 hours
        $payload = json_encode($payload);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) != 3) return false;

        $header = $parts[0];
        $payload = $parts[1];
        $signatureProvided = $parts[2];

        $signature = hash_hmac('sha256', $header . "." . $payload, $this->secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if ($base64UrlSignature === $signatureProvided) {
            $data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
            if ($data['exp'] < time()) return false;
            return $data;
        }
        return false;
    }

    public function authenticate() {
        // Robust way to get the Authorization header across different server setups (Apache/Nginx/CGI)
        $authHeader = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } else {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = trim($headers['Authorization']);
            }
        }

        if (empty($authHeader)) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided. Server might be stripping the Authorization header.']);
            exit;
        }

        $token = str_replace('Bearer ', '', $authHeader);
        $user = $this->verifyToken($token);

        if (!$user) {
            http_response_code(403);
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }
        return $user;
    }
}

// Polyfill for getallheaders() if nginx/fpm doesn't have it
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
?>