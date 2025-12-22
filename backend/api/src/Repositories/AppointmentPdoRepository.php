<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Appointment;
use PDO;

class AppointmentPdoRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
        $this->ensureTable();
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM appointments ORDER BY id DESC');
        $rows = $stmt->fetchAll() ?: [];
        return array_map(fn ($row) => new Appointment($this->hydrateRow($row)), $rows);
    }

    public function find(int $id): ?Appointment
    {
        $stmt = $this->pdo->prepare('SELECT * FROM appointments WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? new Appointment($this->hydrateRow($row)) : null;
    }

    public function create(Appointment $appointment): Appointment
    {
        $data = $appointment->toArray();
        $stmt = $this->pdo->prepare('INSERT INTO appointments 
            (paziente_nome, cf, priorita, stato, data_visita, dottore, parametri, indirizzo, citta, telefono, email, referto) 
            VALUES (:paziente_nome, :cf, :priorita, :stato, :data_visita, :dottore, :parametri, :indirizzo, :citta, :telefono, :email, :referto)');
        $stmt->execute([
            'paziente_nome' => $data['paziente_nome'] ?? null,
            'cf' => $data['cf'] ?? null,
            'priorita' => $data['priorita'] ?? null,
            'stato' => $data['stato'] ?? null,
            'data_visita' => $this->toMysqlDate($data['data_visita'] ?? null),
            'dottore' => $data['dottore'] ?? null,
            'parametri' => $data['parametri'] ?? null,
            'indirizzo' => $data['indirizzo'] ?? null,
            'citta' => $data['citta'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'email' => $data['email'] ?? null,
            'referto' => isset($data['referto']) ? json_encode($data['referto']) : null,
        ]);
        $data['id'] = (int) $this->pdo->lastInsertId();
        return new Appointment($data);
    }

    public function update(int $id, Appointment $appointment): ?Appointment
    {
        $data = $appointment->toArray();
        $stmt = $this->pdo->prepare('UPDATE appointments SET 
            paziente_nome = :paziente_nome,
            cf = :cf,
            priorita = :priorita,
            stato = :stato,
            data_visita = :data_visita,
            dottore = :dottore,
            parametri = :parametri,
            indirizzo = :indirizzo,
            citta = :citta,
            telefono = :telefono,
            email = :email,
            referto = :referto
            WHERE id = :id');
        $stmt->execute([
            'id' => $id,
            'paziente_nome' => $data['paziente_nome'] ?? null,
            'cf' => $data['cf'] ?? null,
            'priorita' => $data['priorita'] ?? null,
            'stato' => $data['stato'] ?? null,
            'data_visita' => $this->toMysqlDate($data['data_visita'] ?? null),
            'dottore' => $data['dottore'] ?? null,
            'parametri' => $data['parametri'] ?? null,
            'indirizzo' => $data['indirizzo'] ?? null,
            'citta' => $data['citta'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'email' => $data['email'] ?? null,
            'referto' => isset($data['referto']) ? json_encode($data['referto']) : null,
        ]);

        return $stmt->rowCount() ? new Appointment($data) : null;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM appointments WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->rowCount();
    }

    private function ensureTable(): void
    {
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS appointments (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            paziente_nome VARCHAR(120) NOT NULL,
            cf VARCHAR(16) NOT NULL,
            priorita VARCHAR(10) NOT NULL DEFAULT "green",
            stato VARCHAR(50) NOT NULL DEFAULT "Registrato",
            data_visita DATETIME NOT NULL,
            dottore VARCHAR(200) NULL,
            parametri VARCHAR(200) NULL,
            indirizzo VARCHAR(200) NULL,
            citta VARCHAR(200) NULL,
            telefono VARCHAR(20) NULL,
            email VARCHAR(120) NULL,
            referto JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_cf (cf),
            INDEX idx_stato (stato),
            INDEX idx_priorita (priorita)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;');
    }

    private function hydrateRow(array $row): array
    {
        if (isset($row['referto']) && is_string($row['referto'])) {
            $decoded = json_decode($row['referto'], true);
            $row['referto'] = is_array($decoded) ? $decoded : null;
        }
        if (isset($row['data_visita'])) {
            $row['data_visita'] = date(DATE_ATOM, strtotime($row['data_visita']));
        }
        $row['id'] = (int) ($row['id'] ?? 0);
        return $row;
    }

    private function toMysqlDate(?string $date): ?string
    {
        if (!$date) {
            return null;
        }
        $timestamp = strtotime($date);
        return $timestamp ? date('Y-m-d H:i:s', $timestamp) : null;
    }
}
