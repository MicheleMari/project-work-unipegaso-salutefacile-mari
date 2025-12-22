<?php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Instrada le chiamate API al front controller del backend
if (strpos($path, '/api') === 0) {
    require __DIR__ . '/backend/api/public/index.php';
    return;
}

$fullPath = realpath(__DIR__ . $path);

// Se il file richiesto esiste (asset statico), servilo direttamente
if ($fullPath && is_file($fullPath)) {
    $mime = mime_content_type($fullPath) ?: 'text/plain';
    header('Content-Type: ' . $mime);
    readfile($fullPath);
    return;
}

// Fallback alla SPA
$index = __DIR__ . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return;
}

http_response_code(404);
echo 'Not Found';
