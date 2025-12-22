<?php

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $dsn = Config::get('database.dsn');
        $user = Config::get('database.user');
        $password = Config::get('database.password');
        $options = Config::get('database.options');

        try {
            self::$pdo = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            throw new \RuntimeException('Database connection failed: ' . $e->getMessage(), 500, $e);
        }

        return self::$pdo;
    }
}
