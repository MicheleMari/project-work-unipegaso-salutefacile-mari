<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\EncounterService;

class AppointmentController
{
    private EncounterService $service;

    public function __construct()
    {
        $this->service = new EncounterService();
    }

    public function index(Request $request): void
    {
        Response::json(['data' => $this->service->list()]);
    }

    public function show(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        Response::json(['data' => $this->service->get($id)]);
    }

    public function store(Request $request): void
    {
        $payload = $request->getBody();
        Response::json(['data' => $this->service->create($payload)], 201);
    }

    public function update(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        $payload = $request->getBody();
        Response::json(['data' => $this->service->replace($id, $payload)]);
    }

    public function patch(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        $payload = $request->getBody();
        Response::json(['data' => $this->service->patch($id, $payload)]);
    }

    public function destroy(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        $this->service->delete($id);
        Response::noContent();
    }
}
