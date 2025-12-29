<?php

namespace App\Models;

class User
{
    public int $id;
    public string $name;
    public string $surname;
    public string $user_identity_code;
    public string $email;
    public string $password_hash;
    public int $permission_id;
    public ?int $department_id;
    public ?string $department;
    public ?string $permission_name;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->name = $data['name'] ?? '';
        $this->surname = $data['surname'] ?? '';
        $this->user_identity_code = $data['user_identity_code'] ?? '';
        $this->email = $data['email'] ?? '';
        $this->password_hash = $data['password_hash'] ?? '';
        $this->permission_id = (int) ($data['permission_id'] ?? 0);
        $this->department_id = isset($data['department_id']) ? (int) $data['department_id'] : null;
        $this->department = $data['department'] ?? null;
        $this->permission_name = $data['permission_name'] ?? null;
    }

    public function fullName(): string
    {
        return trim($this->name . ' ' . $this->surname);
    }
}
