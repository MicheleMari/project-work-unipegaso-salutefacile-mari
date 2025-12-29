<?php

namespace App\Services;

use App\Core\HttpException;
use App\Models\User;
use App\Repositories\UserRepository;

class AuthService
{
    private UserRepository $users;

    public function __construct()
    {
        $this->users = new UserRepository();
    }

    public function login(string $identifier, string $password): array
    {
        $identifier = trim($identifier);
        $user = null;
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $user = $this->users->findByEmail($identifier);
        }
        if (!$user) {
            $user = $this->users->findByIdentityCode($identifier);
        }

        if (!$user || !$this->verifyPassword($password, $user->password_hash)) {
            throw new HttpException('Credenziali non valide', 401);
        }

        $role = $this->mapRole($user);

        return [
            'token' => $user->user_identity_code,
            'user' => [
                'id' => $user->id,
                'name' => $user->fullName(),
                'role' => $role,
                'department' => $user->department,
                'email' => $user->email,
                'identity_code' => $user->user_identity_code,
            ],
        ];
    }

    private function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    private function mapRole(User $user): string
    {
        $permName = strtolower($user->permission_name ?? '');
        $permId = $user->permission_id;
        if ($permId === 1 || str_contains($permName, 'operatore')) {
            return 'operatore';
        }
        if ($permId === 2 || str_contains($permName, 'spec')) {
            return 'dottore';
        }
        return 'admin';
    }
}
