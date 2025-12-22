<?php

namespace App\Repositories;

class JsonStorage
{
    private string $path;

    public function __construct(string $path)
    {
        $this->path = $path;
        $this->ensureLocation();
    }

    public function exists(): bool
    {
        return is_file($this->path);
    }

    public function read(): array
    {
        if (!$this->exists()) {
            return [];
        }

        $handle = fopen($this->path, 'r');
        if ($handle === false) {
            return [];
        }

        flock($handle, LOCK_SH);
        $content = stream_get_contents($handle);
        flock($handle, LOCK_UN);
        fclose($handle);

        $decoded = json_decode($content ?: '[]', true);
        return is_array($decoded) ? $decoded : [];
    }

    public function write(array $data): void
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $handle = fopen($this->path, 'c+');
        if ($handle === false) {
            return;
        }
        flock($handle, LOCK_EX);
        ftruncate($handle, 0);
        fwrite($handle, $json);
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
    }

    private function ensureLocation(): void
    {
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
    }
}
