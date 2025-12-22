<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Encounter;
use App\Models\Patient;
use PDO;

class EncounterRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    public function all(): array
    {
        $sql = 'SELECT 
                    e.id AS encounter_id,
                    e.patient_id,
                    e.arrival_at,
                    e.state,
                    e.priority,
                    e.symptoms,
                    e.doctor_id,
                    e.notes,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.full_name,
                    p.cf,
                    p.birth_date,
                    p.gender,
                    p.address,
                    p.city,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.name AS doctor_name
                FROM ps_encounters e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.doctor_id
                ORDER BY e.arrival_at DESC, e.id DESC';
        $rows = $this->pdo->query($sql)->fetchAll() ?: [];
        return array_map(fn ($row) => $this->map($row), $rows);
    }

    public function allForDoctor(int $doctorId): array
    {
        $sql = 'SELECT 
                    e.id AS encounter_id,
                    e.patient_id,
                    e.arrival_at,
                    e.state,
                    e.priority,
                    e.symptoms,
                    e.doctor_id,
                    e.notes,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.full_name,
                    p.cf,
                    p.birth_date,
                    p.gender,
                    p.address,
                    p.city,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.name AS doctor_name
                FROM ps_encounters e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.doctor_id
                WHERE e.doctor_id = :doctor_id
                ORDER BY e.arrival_at DESC, e.id DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['doctor_id' => $doctorId]);
        $rows = $stmt->fetchAll() ?: [];
        return array_map(fn ($row) => $this->map($row), $rows);
    }

    public function find(int $id): ?Encounter
    {
        $sql = 'SELECT 
                    e.id AS encounter_id,
                    e.patient_id,
                    e.arrival_at,
                    e.state,
                    e.priority,
                    e.symptoms,
                    e.doctor_id,
                    e.notes,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.full_name,
                    p.cf,
                    p.birth_date,
                    p.gender,
                    p.address,
                    p.city,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.name AS doctor_name
                FROM ps_encounters e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.doctor_id
                WHERE e.id = :id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->map($row) : null;
    }

    public function findForDoctor(int $id, int $doctorId): ?Encounter
    {
        $sql = 'SELECT 
                    e.id AS encounter_id,
                    e.patient_id,
                    e.arrival_at,
                    e.state,
                    e.priority,
                    e.symptoms,
                    e.doctor_id,
                    e.notes,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.full_name,
                    p.cf,
                    p.birth_date,
                    p.gender,
                    p.address,
                    p.city,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.name AS doctor_name
                FROM ps_encounters e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.doctor_id
                WHERE e.id = :id AND e.doctor_id = :doctor_id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'doctor_id' => $doctorId]);
        $row = $stmt->fetch();
        return $row ? $this->map($row) : null;
    }

    public function create(Encounter $encounter): Encounter
    {
        $stmt = $this->pdo->prepare('INSERT INTO ps_encounters 
            (patient_id, arrival_at, state, priority, symptoms, doctor_id, notes)
            VALUES (:patient_id, :arrival_at, :state, :priority, :symptoms, :doctor_id, :notes)');
        $stmt->execute([
            'patient_id' => $encounter->patient_id,
            'arrival_at' => $this->toMysqlDate($encounter->arrival_at),
            'state' => $encounter->state,
            'priority' => $encounter->priority,
            'symptoms' => $encounter->symptoms,
            'doctor_id' => $encounter->doctor_id,
            'notes' => $encounter->notes,
        ]);
        $encounter->id = (int) $this->pdo->lastInsertId();
        return $encounter;
    }

    public function update(Encounter $encounter): Encounter
    {
        $stmt = $this->pdo->prepare('UPDATE ps_encounters SET
            arrival_at = :arrival_at,
            state = :state,
            priority = :priority,
            symptoms = :symptoms,
            doctor_id = :doctor_id,
            notes = :notes
            WHERE id = :id');
        $stmt->execute([
            'id' => $encounter->id,
            'arrival_at' => $this->toMysqlDate($encounter->arrival_at),
            'state' => $encounter->state,
            'priority' => $encounter->priority,
            'symptoms' => $encounter->symptoms,
            'doctor_id' => $encounter->doctor_id,
            'notes' => $encounter->notes,
        ]);
        return $encounter;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM ps_encounters WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->rowCount();
    }

    private function map(array $row): Encounter
    {
        $encounterData = [
            'id' => (int) $row['encounter_id'],
            'patient_id' => (int) $row['patient_id'],
            'arrival_at' => $this->toIsoDate($row['arrival_at'] ?? null),
            'state' => $row['state'],
            'priority' => $row['priority'],
            'symptoms' => $row['symptoms'] ?? null,
            'doctor_id' => isset($row['doctor_id']) ? (int) $row['doctor_id'] : null,
            'doctor_name' => $row['doctor_name'] ?? null,
            'notes' => $row['notes'] ?? null,
            'created_at' => $this->toIsoDate($row['encounter_created_at'] ?? null),
            'updated_at' => $this->toIsoDate($row['updated_at'] ?? null),
            'patient' => new Patient([
                'id' => (int) $row['patient_id'],
                'full_name' => $row['full_name'],
                'cf' => $row['cf'],
                'birth_date' => $row['birth_date'] ?? null,
                'gender' => $row['gender'] ?? null,
                'address' => $row['address'] ?? null,
                'city' => $row['city'] ?? null,
                'phone' => $row['phone'] ?? null,
                'email' => $row['email'] ?? null,
                'created_at' => $this->toIsoDate($row['patient_created_at'] ?? null),
            ]),
        ];

        return new Encounter($encounterData);
    }

    private function toIsoDate(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        $ts = strtotime($value);
        return $ts ? date(DATE_ATOM, $ts) : null;
    }

    private function toMysqlDate(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        $ts = strtotime($value);
        return $ts ? date('Y-m-d H:i:s', $ts) : null;
    }
}
