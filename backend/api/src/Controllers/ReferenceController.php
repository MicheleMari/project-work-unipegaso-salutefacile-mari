<?php

namespace App\Controllers;

use App\Core\Config;
use App\Http\Response;
use App\Core\HttpException;
use App\Repositories\InvestigationRepository;
use App\Repositories\DepartmentRepository;

class ReferenceController
{
    private InvestigationRepository $investigations;
    private DepartmentRepository $departments;

    public function __construct()
    {
        $this->investigations = new InvestigationRepository();
        $this->departments = new DepartmentRepository();
    }

    public function departments(): void
    {
        $list = $this->departments->all();
        Response::json(['data' => array_map(fn ($item) => $item->toArray(), $list)]);
    }

    public function cadastral(): void
    {
        $path = Config::get('references.cadastral');
        $this->serveJsonFile($path, 'cadastral');
    }

    public function investigations(): void
    {
        $list = $this->investigations->all();
        Response::json(['data' => array_map(fn ($item) => $item->toArray(), $list)]);
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
