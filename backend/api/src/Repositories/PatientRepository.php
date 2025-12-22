<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Patient;
use PDO;

class PatientRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    public function find(int $id): ?Patient
    {
        $stmt = $this->pdo->prepare('SELECT * FROM patients WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->map($row) : null;
    }

    public function findByCf(string $cf): ?Patient
    {
        $stmt = $this->pdo->prepare('SELECT * FROM patients WHERE cf = :cf');
        $stmt->execute(['cf' => $cf]);
        $row = $stmt->fetch();
        return $row ? $this->map($row) : null;
    }

    public function create(Patient $patient): Patient
    {
        $stmt = $this->pdo->prepare('INSERT INTO patients 
            (full_name, cf, birth_date, gender, address, city, phone, email) 
            VALUES (:full_name, :cf, :birth_date, :gender, :address, :city, :phone, :email)');
        $stmt->execute([
            'full_name' => $patient->full_name,
            'cf' => $patient->cf,
            'birth_date' => $patient->birth_date,
            'gender' => $patient->gender,
            'address' => $patient->address,
            'city' => $patient->city,
            'phone' => $patient->phone,
            'email' => $patient->email,
        ]);
        $patient->id = (int) $this->pdo->lastInsertId();
        return $patient;
    }

    public function update(Patient $patient): Patient
    {
        $stmt = $this->pdo->prepare('UPDATE patients SET 
            full_name = :full_name,
            cf = :cf,
            birth_date = :birth_date,
            gender = :gender,
            address = :address,
            city = :city,
            phone = :phone,
            email = :email
            WHERE id = :id');
        $stmt->execute([
            'id' => $patient->id,
            'full_name' => $patient->full_name,
            'cf' => $patient->cf,
            'birth_date' => $patient->birth_date,
            'gender' => $patient->gender,
            'address' => $patient->address,
            'city' => $patient->city,
            'phone' => $patient->phone,
            'email' => $patient->email,
        ]);
        return $patient;
    }

    private function map(array $row): Patient
    {
        $row['id'] = (int) ($row['id'] ?? 0);
        return new Patient($row);
    }
}
