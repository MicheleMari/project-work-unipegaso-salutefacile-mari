<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Investigation;
use PDO;

class InvestigationRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * @return Investigation[]
     */
    public function all(): array
    {
        $rows = $this->pdo->query('SELECT id, title, description FROM investigations ORDER BY title ASC, id ASC')->fetchAll() ?: [];
        return array_map(fn ($row) => new Investigation($row), $rows);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listForEncounter(int $encounterId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT 
                ip.id,
                ip.emergency_id,
                ip.investigation_id,
                ip.performed_by,
                ip.performed_at,
                ip.outcome,
                ip.notes,
                ip.attachment_path,
                inv.title,
                inv.description
            FROM investigations_performed ip
            JOIN investigations inv ON inv.id = ip.investigation_id
            WHERE ip.emergency_id = :encounter_id
            ORDER BY ip.performed_at ASC, ip.id ASC'
        );
        $stmt->execute(['encounter_id' => $encounterId]);
        $rows = $stmt->fetchAll() ?: [];
        return array_map([$this, 'mapPerformed'], $rows);
    }

    /**
     * Sovrascrive le esecuzioni per un encounter con l'elenco fornito.
     *
     * @param int[] $investigationIds
     */
    public function syncPerformed(int $encounterId, array $investigationIds, ?int $userId = null): void
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $investigationIds), fn ($id) => $id > 0)));
        $this->pdo->beginTransaction();
        try {
            $delete = $this->pdo->prepare('DELETE FROM investigations_performed WHERE emergency_id = :encounter_id');
            $delete->execute(['encounter_id' => $encounterId]);

            if (!empty($ids)) {
                $insert = $this->pdo->prepare(
                    'INSERT INTO investigations_performed (emergency_id, investigation_id, performed_by) 
                     VALUES (:encounter_id, :investigation_id, :performed_by)'
                );
                foreach ($ids as $id) {
                    $insert->execute([
                        'encounter_id' => $encounterId,
                        'investigation_id' => $id,
                        'performed_by' => $userId ?: 1,
                    ]);
                }
            }

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapPerformed(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'emergency_id' => (int) $row['emergency_id'],
            'investigation_id' => (int) $row['investigation_id'],
            'title' => $row['title'] ?? '',
            'description' => $row['description'] ?? null,
            'performed_by' => $row['performed_by'] !== null ? (int) $row['performed_by'] : null,
            'performed_at' => $row['performed_at'] ?? null,
            'outcome' => $row['outcome'] ?? null,
            'notes' => $row['notes'] ?? null,
            'attachment_path' => $row['attachment_path'] ?? null,
        ];
    }
}
