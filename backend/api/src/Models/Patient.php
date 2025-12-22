<?php

namespace App\Models;

class Patient
{
    public int $id;
    public string $full_name;
    public string $cf;
    public ?string $birth_date;
    public ?string $gender;
    public ?string $address;
    public ?string $city;
    public ?string $phone;
    public ?string $email;
    public ?string $created_at;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->full_name = trim((string) ($data['full_name'] ?? ''));
        $this->cf = strtoupper(trim((string) ($data['cf'] ?? '')));
        $this->birth_date = $data['birth_date'] ?? null;
        $this->gender = $data['gender'] ?? null;
        $this->address = $data['address'] ?? null;
        $this->city = $data['city'] ?? null;
        $this->phone = $data['phone'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->created_at = $data['created_at'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'cf' => $this->cf,
            'birth_date' => $this->birth_date,
            'gender' => $this->gender,
            'address' => $this->address,
            'city' => $this->city,
            'phone' => $this->phone,
            'email' => $this->email,
            'created_at' => $this->created_at,
        ];
    }
}
