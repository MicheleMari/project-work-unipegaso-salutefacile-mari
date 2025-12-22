<?php

namespace App\Core;

use RuntimeException;

class HttpException extends RuntimeException
{
    private int $statusCode;

    public function __construct(string $message, int $statusCode = 400, int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
