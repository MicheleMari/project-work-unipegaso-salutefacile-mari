<?php

namespace App\Http;

use App\Core\Config;
use App\Core\HttpException;
use App\Core\Security;

class Response
{
    public static function json($data, int $status = 200, array $headers = [], array $logContext = []): void
    {
        self::applyCors();
        http_response_code($status);
        header('Content-Type: application/json');
        foreach ($headers as $name => $value) {
            header($name . ': ' . $value);
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        Security::log($status, $logContext);
        exit;
    }

    public static function noContent(int $status = 204): void
    {
        self::applyCors();
        http_response_code($status);
        Security::log($status);
        exit;
    }

    public static function error(\Throwable $throwable): void
    {
        $mask = Config::get('security.error_mask', 'Unexpected error');
        $isHttp = $throwable instanceof HttpException;
        $status = $isHttp ? $throwable->getStatusCode() : 500;
        $message = $isHttp ? $throwable->getMessage() : $mask;
        $payload = ['error' => $message];
        $logCtx = $status >= 500 ? ['error' => $throwable->getMessage()] : [];
        self::json($payload, $status, [], $logCtx);
    }

    public static function options(): void
    {
        self::applyCors();
        http_response_code(204);
        Security::log(204, ['preflight' => true]);
        exit;
    }

    private static function applyCors(): void
    {
        $securityOrigins = Config::get('security.allowed_origins', []);
        $origins = $securityOrigins ?: Config::get('cors.allowed_origins', '*');
        $methods = Config::get('cors.allowed_methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        $headers = Config::get('cors.allowed_headers', 'Content-Type, Authorization');
        $csp = Config::get('security.csp', '');

        $originHeader = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigin = '';

        if ($origins === '*' || $origins === ['*']) {
            $allowedOrigin = '*';
        } elseif (is_array($origins) && $originHeader && in_array($originHeader, $origins, true)) {
            $allowedOrigin = $originHeader;
        } elseif (is_string($origins) && $origins === $originHeader) {
            $allowedOrigin = $originHeader;
        }

        if ($allowedOrigin) {
            header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        }

        header('Access-Control-Allow-Methods: ' . $methods);
        header('Access-Control-Allow-Headers: ' . $headers);
        header('Vary: Origin');
        if ($csp) {
            header('Content-Security-Policy: ' . $csp);
        }
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: no-referrer');
        header('X-XSS-Protection: 1; mode=block');
    }
}
