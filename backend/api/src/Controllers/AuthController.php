<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\AuthService;

class AuthController
{
    private AuthService $service;

    public function __construct()
    {
        $this->service = new AuthService();
    }

    public function login(Request $request): void
    {
        $body = $request->getBody();
        $identifier = trim((string) ($body['email'] ?? $body['identifier'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        $result = $this->service->login($identifier, $password);
        Response::json(['data' => $result]);
    }
}
