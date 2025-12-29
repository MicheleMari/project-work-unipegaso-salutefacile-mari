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
                    e.status,
                    e.alert_code,
                    e.description,
                    e.vital_signs,
                    e.user_id AS doctor_id,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.name,
                    p.surname,
                    p.fiscal_code,
                    p.residence_address,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.id AS doctor_id,
                    u.name AS doctor_name,
                    u.surname AS doctor_surname,
                    d.name AS doctor_department
                FROM emergency e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.user_id
                LEFT JOIN departments d ON d.id = u.department_id
                ORDER BY e.created_at DESC, e.id DESC';
        $rows = $this->pdo->query($sql)->fetchAll() ?: [];
        return array_map(fn ($row) => $this->map($row), $rows);
    }

    public function allForDoctor(int $doctorId): array
    {
        $sql = 'SELECT 
                    e.id AS encounter_id,
                    e.patient_id,
                    e.status,
                    e.alert_code,
                    e.description,
                    e.vital_signs,
                    e.user_id AS doctor_id,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.name,
                    p.surname,
                    p.fiscal_code,
                    p.residence_address,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.id AS doctor_id,
                    u.name AS doctor_name,
                    u.surname AS doctor_surname,
                    d.name AS doctor_department
                FROM emergency e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.user_id
                LEFT JOIN departments d ON d.id = u.department_id
                WHERE e.user_id = :doctor_id
                ORDER BY e.created_at DESC, e.id DESC';
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
                    e.status,
                    e.alert_code,
                    e.description,
                    e.vital_signs,
                    e.user_id AS doctor_id,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.name,
                    p.surname,
                    p.fiscal_code,
                    p.residence_address,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.id AS doctor_id,
                    u.name AS doctor_name,
                    u.surname AS doctor_surname,
                    d.name AS doctor_department
                FROM emergency e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.user_id
                LEFT JOIN departments d ON d.id = u.department_id
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
                    e.status,
                    e.alert_code,
                    e.description,
                    e.vital_signs,
                    e.user_id AS doctor_id,
                    e.created_at AS encounter_created_at,
                    e.updated_at,
                    p.id AS patient_id,
                    p.name,
                    p.surname,
                    p.fiscal_code,
                    p.residence_address,
                    p.phone,
                    p.email,
                    p.created_at AS patient_created_at,
                    u.id AS doctor_id,
                    u.name AS doctor_name,
                    u.surname AS doctor_surname,
                    d.name AS doctor_department
                FROM emergency e
                JOIN patients p ON p.id = e.patient_id
                LEFT JOIN users u ON u.id = e.user_id
                LEFT JOIN departments d ON d.id = u.department_id
                WHERE e.id = :id AND e.user_id = :doctor_id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'doctor_id' => $doctorId]);
        $row = $stmt->fetch();
        return $row ? $this->map($row) : null;
    }

    public function create(Encounter $encounter): Encounter
    {
        $stmt = $this->pdo->prepare('INSERT INTO emergency 
            (patient_id, status, alert_code, description, vital_signs, user_id)
            VALUES (:patient_id, :status, :alert_code, :description, :vital_signs, :user_id)');
        $stmt->execute([
            'patient_id' => $encounter->patient_id,
            'status' => $encounter->state,
            'alert_code' => $this->priorityToDb($encounter->priority),
            'description' => $encounter->symptoms,
            'vital_signs' => $encounter->notes ? json_encode(['notes' => $encounter->notes]) : null,
            'user_id' => $encounter->doctor_id,
        ]);
        $encounter->id = (int) $this->pdo->lastInsertId();
        return $encounter;
    }

    public function update(Encounter $encounter): Encounter
    {
        $stmt = $this->pdo->prepare('UPDATE emergency SET
            status = :status,
            alert_code = :alert_code,
            description = :description,
            vital_signs = :vital_signs,
            user_id = :user_id
            WHERE id = :id');
        $stmt->execute([
            'id' => $encounter->id,
            'status' => $encounter->state,
            'alert_code' => $this->priorityToDb($encounter->priority),
            'description' => $encounter->symptoms,
            'vital_signs' => $encounter->notes ? json_encode(['notes' => $encounter->notes]) : null,
            'user_id' => $encounter->doctor_id,
        ]);
        return $encounter;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM emergency WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->rowCount();
    }

    private function map(array $row): Encounter
    {
        $vitalSigns = $row['vital_signs'] ?? null;
        if (is_string($vitalSigns)) {
            $vitalSigns = json_decode($vitalSigns, true);
        }
        $notes = is_array($vitalSigns) ? ($vitalSigns['notes'] ?? null) : null;

        $encounterData = [
            'id' => (int) $row['encounter_id'],
            'patient_id' => (int) $row['patient_id'],
            'arrival_at' => $this->toIsoDate($row['encounter_created_at'] ?? null),
            'state' => $row['status'],
            'priority' => $this->priorityFromDb($row['alert_code'] ?? null),
            'symptoms' => $row['description'] ?? null,
            'doctor_id' => isset($row['doctor_id']) ? (int) $row['doctor_id'] : null,
            'doctor_name' => trim(($row['doctor_name'] ?? '') . ' ' . ($row['doctor_surname'] ?? '')) ?: null,
            'doctor_department' => $row['doctor_department'] ?? null,
            'notes' => $notes,
            'created_at' => $this->toIsoDate($row['encounter_created_at'] ?? null),
            'updated_at' => $this->toIsoDate($row['updated_at'] ?? null),
            'patient' => new Patient([
                'id' => (int) $row['patient_id'],
                'name' => $row['name'],
                'surname' => $row['surname'],
                'fiscal_code' => $row['fiscal_code'],
                'residence_address' => $row['residence_address'] ?? null,
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

    private function priorityToDb(?string $priority): ?string
    {
        return match ($priority) {
            'red', 'rosso' => 'rosso',
            'orange', 'arancio' => 'arancio',
            'white', 'bianco' => 'bianco',
            'green', 'giallo', 'verde' => 'giallo', // schema supports giallo, map verde to giallo
            default => null,
        };
    }

    private function priorityFromDb(?string $alert): string
    {
        return match ($alert) {
            'rosso' => 'red',
            'arancio' => 'orange',
            'bianco' => 'white',
            'giallo' => 'green',
            default => 'green',
        };
    }
}
