<?php

namespace App\Models;

class Patient
{
    public int $id;
    public string $name;
    public string $surname;
    public string $fiscal_code;
    public ?string $residence_address;
    public ?string $phone;
    public ?string $email;
    public ?string $created_at;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->name = trim((string) ($data['name'] ?? ''));
        $this->surname = trim((string) ($data['surname'] ?? ''));
        $this->fiscal_code = strtoupper(trim((string) ($data['fiscal_code'] ?? '')));
        $this->residence_address = $data['residence_address'] ?? null;
        $this->phone = $data['phone'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->created_at = $data['created_at'] ?? null;
    }

    public function fullName(): string
    {
        return trim($this->name . ' ' . $this->surname);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->fullName(),
            'cf' => $this->fiscal_code,
            'name' => $this->name,
            'surname' => $this->surname,
            'residence_address' => $this->residence_address,
            'phone' => $this->phone,
            'email' => $this->email,
            'created_at' => $this->created_at,
        ];
    }
}
