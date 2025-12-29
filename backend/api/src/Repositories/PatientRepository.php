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
        $stmt = $this->pdo->prepare('SELECT * FROM patients WHERE fiscal_code = :cf');
        $stmt->execute(['cf' => $cf]);
        $row = $stmt->fetch();
        return $row ? $this->map($row) : null;
    }

    public function create(Patient $patient): Patient
    {
        $stmt = $this->pdo->prepare('INSERT INTO patients 
            (name, surname, fiscal_code, residence_address, phone, email) 
            VALUES (:name, :surname, :fiscal_code, :residence_address, :phone, :email)');
        $stmt->execute([
            'name' => $patient->name,
            'surname' => $patient->surname,
            'fiscal_code' => $patient->fiscal_code,
            'residence_address' => $patient->residence_address,
            'phone' => $patient->phone,
            'email' => $patient->email,
        ]);
        $patient->id = (int) $this->pdo->lastInsertId();
        return $patient;
    }

    public function update(Patient $patient): Patient
    {
        $stmt = $this->pdo->prepare('UPDATE patients SET 
            name = :name,
            surname = :surname,
            fiscal_code = :fiscal_code,
            residence_address = :residence_address,
            phone = :phone,
            email = :email
            WHERE id = :id');
        $stmt->execute([
            'id' => $patient->id,
            'name' => $patient->name,
            'surname' => $patient->surname,
            'fiscal_code' => $patient->fiscal_code,
            'residence_address' => $patient->residence_address,
            'phone' => $patient->phone,
            'email' => $patient->email,
        ]);
        return $patient;
    }

    private function map(array $row): Patient
    {
        $row['id'] = (int) ($row['id'] ?? 0);
        $row['fiscal_code'] = $row['fiscal_code'] ?? ($row['cf'] ?? null);
        return new Patient($row);
    }
}
