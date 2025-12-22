<?php

namespace App\Core;

use App\Http\Request;

class Audit
{
    public static function log(int $status, array $context = []): void
    {
        $basePath = Config::get('logging.path');
        if (!$basePath) {
            return;
        }

        $dir = dirname($basePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $today = date('Y-m-d');
        $logFile = $basePath . '.' . $today;
        $request = Security::getCurrentRequest();

        $line = [
            'ts' => date(DATE_ATOM),
            'status' => $status,
            'method' => $request ? $request->getMethod() : ($_SERVER['REQUEST_METHOD'] ?? ''),
            'path' => $request ? $request->getPath() : ($_SERVER['REQUEST_URI'] ?? ''),
            'ip' => $request ? $request->getClientIp() : ($_SERVER['REMOTE_ADDR'] ?? ''),
            'user' => $request ? $request->getUser() : null,
            'context' => $context ?: null,
        ];

        $payload = json_encode($line) . PHP_EOL;
        file_put_contents($logFile, $payload, FILE_APPEND | LOCK_EX);

        self::enforceRetention($basePath, (int) Config::get('logging.retention_days', 14));
    }

    private static function enforceRetention(string $basePath, int $days): void
    {
        if ($days <= 0) {
            return;
        }
        $threshold = strtotime('-' . $days . ' days');
        foreach (glob($basePath . '.*') as $file) {
            $datePart = substr($file, strrpos($file, '.') + 1);
            if (strtotime($datePart) !== false && strtotime($datePart) < $threshold) {
                @unlink($file);
            }
        }
    }
}
