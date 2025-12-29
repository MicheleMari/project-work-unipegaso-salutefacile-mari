<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\User;
use PDO;

class UserRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->pdo->prepare('SELECT u.*, p.name AS permission_name, d.name AS department 
            FROM users u 
            JOIN permissions p ON p.id = u.permission_id
            LEFT JOIN departments d ON d.id = u.department_id
            WHERE u.email = :email');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function findByIdentityCode(string $code): ?User
    {
        $stmt = $this->pdo->prepare('SELECT u.*, p.name AS permission_name, d.name AS department 
            FROM users u 
            JOIN permissions p ON p.id = u.permission_id
            LEFT JOIN departments d ON d.id = u.department_id
            WHERE u.user_identity_code = :code');
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }
}
