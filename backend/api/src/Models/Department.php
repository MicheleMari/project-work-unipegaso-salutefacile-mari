<?php

namespace App\Models;

class Department
{
    public int $id;
    public string $name;
    public ?string $icon;
    public ?string $color;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->name = (string) ($data['name'] ?? '');
        $this->icon = $data['icon'] ?? null;
        $this->color = $data['color'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'icon' => $this->icon,
            'color' => $this->color,
        ];
    }
}
