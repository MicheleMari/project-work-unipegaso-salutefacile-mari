<?php

return [
    'app' => [
        // Prefisso per tutte le rotte API
        'base_path' => '/api',
    ],
    'auth' => [
        'enabled' => true,
        // Token statici (sviluppo e demo)
        'tokens' => [
            'dev-admin-token' => ['role' => 'admin', 'name' => 'Dev Admin', 'id' => 1, 'department' => 'Direzione'],
            'dev-operatore-token' => ['role' => 'operatore', 'name' => 'Dev Operatore', 'id' => 2, 'department' => 'PS'],
            'dev-dottore-token' => ['role' => 'dottore', 'name' => 'Dr. Rossi', 'id' => 3, 'department' => 'Ginecologia'],
        ],
        'roles_hierarchy' => [
            'admin' => ['admin', 'operatore', 'dottore'],
            'operatore' => ['operatore'],
            'dottore' => ['dottore'],
        ],
    ],
    'storage' => [
        // driver: json | mysql
        'driver' => getenv('STORAGE_DRIVER') ?: 'mysql',
        'appointments' => __DIR__ . '/../storage/appointments.json',
    ],
    'database' => [
        'dsn' => getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;port=3306;dbname=salutefacile;charset=utf8mb4',
        'user' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: 'root',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
    ],
    'references' => [
        // File condivisi col frontend per evitare duplicazioni
        'departments' => realpath(__DIR__ . '/../../frontend/data/departments.json'),
        'cadastral' => realpath(__DIR__ . '/../../frontend/data/cadastral.json'),
    ],
    'security' => [
        'allowed_origins' => [
            'http://localhost:8000',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:3000',
            'http://123.553.667.2',
        ],
        'rate_limit' => [
            'window' => 60,
            'max' => 120,
            'per_identity' => 240,
        ],
        'error_mask' => 'Request failed',
        'csp' => "default-src 'self' data: blob:; script-src 'self' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://npmcdn.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://npmcdn.com https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://auth.salutefacile.local http://127.0.0.1:8000 http://localhost:8000; frame-ancestors 'none'; upgrade-insecure-requests",
    ],
    'cors' => [
        'allowed_origins' => '*',
        'allowed_methods' => 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'allowed_headers' => 'Content-Type, Authorization',
    ],
    'logging' => [
        // File di log monitorato dal tuo shipper
        'path' => __DIR__ . '/../storage/logs/api.log',
        'retention_days' => 30,
    ],
];
