<?php

namespace App\Models;

class Investigation
{
    public int $id;
    public string $title;
    public ?string $description;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->title = (string) ($data['title'] ?? '');
        $this->description = $data['description'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
        ];
    }
}
