<?php

namespace App\Controllers;

use App\Core\Config;
use App\Http\Response;
use App\Core\HttpException;

class ReferenceController
{
    public function departments(): void
    {
        $path = Config::get('references.departments');
        $this->serveJsonFile($path, 'departments');
    }

    public function cadastral(): void
    {
        $path = Config::get('references.cadastral');
        $this->serveJsonFile($path, 'cadastral');
    }

    private function serveJsonFile(?string $path, string $label): void
    {
        if (!$path || !is_file($path)) {
            throw new HttpException(ucfirst($label) . ' data not found', 404);
        }

        $data = json_decode(file_get_contents($path) ?: '[]', true);
        Response::json(['data' => $data]);
    }
}
