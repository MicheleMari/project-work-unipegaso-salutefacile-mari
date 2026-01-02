<?php

namespace App\Repositories;

use App\Core\Database;
use PDO;

class AttachmentRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function createForInvestigation(array $payload, int $investigationPerformedId): int
    {
        $data = $this->normalize($payload);
        if ($data['storage_path'] === null) {
            throw new \InvalidArgumentException('Percorso file mancante per l\'attachment');
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO attachments (investigation_id, specialist_visit_id, storage_path, original_name, mime_type, size_bytes)
             VALUES (:investigation_id, NULL, :storage_path, :original_name, :mime_type, :size_bytes)'
        );
        $stmt->execute([
            'investigation_id' => $investigationPerformedId,
            'storage_path' => $data['storage_path'],
            'original_name' => $data['original_name'],
            'mime_type' => $data['mime_type'],
            'size_bytes' => $data['size_bytes'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @param int[] $investigationIds
     */
    public function deleteForInvestigations(array $investigationIds): void
    {
        if (empty($investigationIds)) {
            return;
        }
        $placeholders = implode(',', array_fill(0, count($investigationIds), '?'));
        $stmt = $this->pdo->prepare("DELETE FROM attachments WHERE investigation_id IN ({$placeholders})");
        $stmt->execute($investigationIds);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{storage_path: ?string, original_name: string, mime_type: string, size_bytes: ?int}
     */
    private function normalize(array $payload): array
    {
        $storagePath = trim((string) ($payload['storage_path'] ?? $payload['path'] ?? ''));
        $storagePath = $storagePath !== '' ? mb_substr($storagePath, 0, 255) : null;

        $originalName = trim((string) ($payload['original_name'] ?? $payload['filename'] ?? ''));
        if ($originalName === '' && $storagePath) {
            $originalName = basename($storagePath);
        }
        $originalName = $originalName !== '' ? mb_substr($originalName, 0, 255) : 'file';

        $mimeType = trim((string) ($payload['mime_type'] ?? $payload['mime'] ?? 'application/octet-stream'));
        $mimeType = $mimeType !== '' ? mb_substr($mimeType, 0, 100) : 'application/octet-stream';

        $size = $payload['size_bytes'] ?? $payload['size'] ?? null;
        $sizeBytes = is_numeric($size) ? (int) $size : null;

        return [
            'storage_path' => $storagePath,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
        ];
    }
}
