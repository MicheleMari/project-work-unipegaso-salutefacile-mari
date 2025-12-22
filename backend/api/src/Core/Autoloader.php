<?php

namespace App\Core;

class Autoloader
{
    public static function register(): void
    {
        spl_autoload_register([self::class, 'autoload']);
    }

    private static function autoload(string $class): void
    {
        $prefix = 'App\\';
        if (strpos($class, $prefix) !== 0) {
            return;
        }

        $relative = substr($class, strlen($prefix));
        $path = __DIR__ . '/../' . str_replace('\\', '/', $relative) . '.php';

        if (is_file($path)) {
            require $path;
        }
    }
}
