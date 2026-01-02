<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Investigation;
use PDO;

class InvestigationRepository
{
    private PDO $pdo;
    private AttachmentRepository $attachments;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
        $this->attachments = new AttachmentRepository();
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
                ip.attachment_id,
                att.storage_path,
                att.original_name,
                att.mime_type,
                att.size_bytes,
                inv.title,
                inv.description
            FROM investigations_performed ip
            JOIN investigations inv ON inv.id = ip.investigation_id
            LEFT JOIN attachments att ON att.id = ip.attachment_id
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
    public function syncPerformed(int $encounterId, array $investigations, ?int $userId = null): void
    {
        $items = [];
        foreach ($investigations as $item) {
            if (is_array($item)) {
                $invId = isset($item['investigation_id']) ? (int) $item['investigation_id'] : 0;
                if ($invId <= 0) {
                    continue;
                }
                $attachment = $this->normalizeAttachment($item['attachment'] ?? null, $item);
                $items[] = [
                    'investigation_id' => $invId,
                    'outcome' => $item['outcome'] ?? null,
                    'notes' => $item['notes'] ?? null,
                    'attachment' => $attachment,
                ];
            } else {
                $invId = (int) $item;
                if ($invId > 0) {
                    $items[] = ['investigation_id' => $invId, 'outcome' => null, 'notes' => null, 'attachment' => null];
                }
            }
        }
        $this->pdo->beginTransaction();
        try {
            $existingIds = $this->fetchInvestigationIds($encounterId);
            if (!empty($existingIds)) {
                $this->attachments->deleteForInvestigations($existingIds);
            }
            $delete = $this->pdo->prepare('DELETE FROM investigations_performed WHERE emergency_id = :encounter_id');
            $delete->execute(['encounter_id' => $encounterId]);

            if (!empty($items)) {
                $insert = $this->pdo->prepare(
                    'INSERT INTO investigations_performed (emergency_id, investigation_id, performed_by, outcome, notes, attachment_id) 
                     VALUES (:encounter_id, :investigation_id, :performed_by, :outcome, :notes, NULL)'
                );
                $linkAttachment = $this->pdo->prepare(
                    'UPDATE investigations_performed SET attachment_id = :attachment_id WHERE id = :id'
                );
                foreach ($items as $item) {
                    $insert->execute([
                        'encounter_id' => $encounterId,
                        'investigation_id' => $item['investigation_id'],
                        'performed_by' => $userId ?: 1,
                        'outcome' => $item['outcome'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);
                    $investigationPerformedId = (int) $this->pdo->lastInsertId();
                    if (!empty($item['attachment'])) {
                        $attachmentId = $this->attachments->createForInvestigation($item['attachment'], $investigationPerformedId);
                        $linkAttachment->execute([
                            'attachment_id' => $attachmentId,
                            'id' => $investigationPerformedId,
                        ]);
                    }
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
        $attachment = null;
        if (!empty($row['attachment_id'])) {
            $attachment = [
                'id' => (int) $row['attachment_id'],
                'storage_path' => $row['storage_path'] ?? null,
                'original_name' => $row['original_name'] ?? null,
                'mime_type' => $row['mime_type'] ?? null,
                'size_bytes' => isset($row['size_bytes']) ? (int) $row['size_bytes'] : null,
            ];
        }

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
            'attachment_id' => $attachment['id'] ?? null,
            'attachment_path' => $attachment['storage_path'] ?? null,
            'attachment' => $attachment,
        ];
    }

    /**
     * @param array<string, mixed>|null $raw
     * @param array<string, mixed> $fallback
     * @return array<string, mixed>|null
     */
    private function normalizeAttachment(?array $raw, array $fallback): ?array
    {
        $payload = $raw ?? [];
        // Backward compatibilitÇÿ: se arriva solo attachment_path nel payload usa quello
        if (empty($payload) && !empty($fallback['attachment_path'])) {
            $payload = [
                'storage_path' => $fallback['attachment_path'],
                'original_name' => $fallback['attachment_name'] ?? null,
                'mime_type' => $fallback['attachment_mime'] ?? null,
                'size_bytes' => $fallback['attachment_size'] ?? null,
            ];
        }

        $storagePath = trim((string) ($payload['storage_path'] ?? $payload['path'] ?? ''));
        if ($storagePath === '') {
            return null;
        }

        $originalName = $payload['original_name'] ?? $payload['filename'] ?? null;
        $mimeType = $payload['mime_type'] ?? $payload['mime'] ?? null;
        $sizeBytes = $payload['size_bytes'] ?? $payload['size'] ?? null;

        return [
            'storage_path' => $storagePath,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
        ];
    }

    /**
     * @return int[]
     */
    private function fetchInvestigationIds(int $encounterId): array
    {
        $stmt = $this->pdo->prepare('SELECT id FROM investigations_performed WHERE emergency_id = :encounter_id');
        $stmt->execute(['encounter_id' => $encounterId]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return array_map('intval', $ids ?: []);
    }
}
