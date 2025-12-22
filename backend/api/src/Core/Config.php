<?php

namespace App\Core;

class Config
{
    private static array $config = [];

    public static function load(string $path): void
    {
        if (!is_file($path)) {
            throw new \RuntimeException('Config file not found: ' . $path);
        }
        $data = require $path;
        if (!is_array($data)) {
            throw new \RuntimeException('Config file must return array.');
        }
        self::$config = $data;
    }

    public static function get(string $key, $default = null)
    {
        $segments = explode('.', $key);
        $value = self::$config;
        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }
        return $value;
    }
}
