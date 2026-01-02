<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;

class UploadController
{
    private string $uploadDir;

    public function __construct()
    {
        // Salva i file nella cartella /uploads alla root del progetto
        $this->uploadDir = dirname(__DIR__, 3) . '/uploads';
    }

    public function store(Request $request): void
    {
        if (empty($_FILES['file'])) {
            throw new \RuntimeException('Nessun file caricato');
        }
        $file = $_FILES['file'];
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('Errore durante il caricamento del file');
        }

        $allowed = ['application/pdf', 'image/png', 'image/jpeg'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        $size = (int) ($file['size'] ?? 0);
        if ($size > $maxSize) {
            throw new \RuntimeException('File troppo grande (max 5MB)');
        }

        $mime = null;
        if (is_uploaded_file($file['tmp_name'] ?? '')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = $finfo ? finfo_file($finfo, $file['tmp_name']) : null;
            if ($finfo) {
                finfo_close($finfo);
            }
        }
        if ($mime && !in_array($mime, $allowed, true)) {
            throw new \RuntimeException('Tipo file non consentito');
        }

        if (!is_dir($this->uploadDir) && !mkdir($this->uploadDir, 0775, true)) {
            throw new \RuntimeException('Impossibile creare la cartella upload');
        }

        $ext = pathinfo($file['name'] ?? 'file', PATHINFO_EXTENSION);
        $safeExt = $ext ? '.' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $ext)) : '';
        $base = pathinfo($file['name'] ?? 'file', PATHINFO_FILENAME);
        $safeBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', $base) ?: 'file';
        $unique = bin2hex(random_bytes(6));
        $filename = $unique . '_' . $safeBase . $safeExt;
        $target = rtrim($this->uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            throw new \RuntimeException('Impossibile salvare il file');
        }

        $publicPath = '/uploads/' . $filename;
        Response::json([
            'data' => [
                'storage_path' => $publicPath,
                'path' => $publicPath,
                'filename' => $filename,
                'original_name' => $file['name'] ?? $filename,
                'mime_type' => $mime ?: ($file['type'] ?? 'application/octet-stream'),
                'mime' => $mime ?: ($file['type'] ?? 'application/octet-stream'),
                'size_bytes' => $size,
                'size' => $size,
            ]
        ]);
    }
}
