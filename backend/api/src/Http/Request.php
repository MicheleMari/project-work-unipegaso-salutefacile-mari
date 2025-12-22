<?php

namespace App\Http;

class Request
{
    private string $method;
    private string $path;
    private array $query;
    private array $headers;
    private array $body;
    private array $user = [];

    public function __construct(string $method, string $path, array $query, array $headers, array $body)
    {
        $this->method = strtoupper($method);
        $this->path = $path;
        $this->query = $query;
        $this->headers = array_change_key_case($headers, CASE_LOWER);
        $this->body = $body;
    }

    public static function fromGlobals(): self
    {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw ?: '', true);
        $body = is_array($json) ? $json : ($_POST ?: []);

        return new self(
            $_SERVER['REQUEST_METHOD'] ?? 'GET',
            parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/',
            $_GET,
            function_exists('getallheaders') ? (getallheaders() ?: []) : [],
            $body
        );
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getQuery(): array
    {
        return $this->query;
    }

    public function getBody(): array
    {
        return $this->body;
    }

    public function get(string $key, $default = null)
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function getHeader(string $name): ?string
    {
        $key = strtolower($name);
        return $this->headers[$key] ?? null;
    }

    public function getBearerToken(): ?string
    {
        $header = $this->getHeader('authorization') ?? '';
        if (stripos($header, 'bearer ') === 0) {
            return trim(substr($header, 7));
        }
        return null;
    }

    public function getClientIp(): string
    {
        $forwarded = $this->getHeader('x-forwarded-for');
        if ($forwarded) {
            $parts = explode(',', $forwarded);
            return trim($parts[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    public function setUser(array $user): void
    {
        $this->user = $user;
    }

    public function getUser(): array
    {
        return $this->user;
    }
}
