<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Department;
use PDO;

class DepartmentRepository
{
    private PDO $pdo;

    /** @var array<string, array<string, string>> */
    private array $styleMap = [
        'medicina generale' => ['icon' => 'activity', 'color' => 'blue'],
        'medicina generale ps' => ['icon' => 'activity', 'color' => 'blue'],
        'cardiologia' => ['icon' => 'heart-pulse', 'color' => 'red'],
        'chirurgia' => ['icon' => 'scissors', 'color' => 'emerald'],
        'chirurgia generale' => ['icon' => 'scissors', 'color' => 'emerald'],
        'ortopedia' => ['icon' => 'bone', 'color' => 'orange'],
        'neurologia' => ['icon' => 'brain', 'color' => 'purple'],
        'pediatria' => ['icon' => 'baby', 'color' => 'cyan'],
        'ginecologia' => ['icon' => 'user', 'color' => 'pink'],
        'oculistica' => ['icon' => 'eye', 'color' => 'indigo'],
        'malattie infettive' => ['icon' => 'biohazard', 'color' => 'yellow'],
        'radiologia' => ['icon' => 'radiation', 'color' => 'amber'],
        'ostetricia' => ['icon' => 'heart', 'color' => 'rose'],
        'urologia' => ['icon' => 'droplets', 'color' => 'teal'],
        'dermatologia' => ['icon' => 'sprout', 'color' => 'lime'],
        'gastroenterologia' => ['icon' => 'cup-soda', 'color' => 'violet'],
        'endocrinologia' => ['icon' => 'pill', 'color' => 'fuchsia'],
        'oncologia' => ['icon' => 'flask-conical', 'color' => 'indigo'],
        'psichiatria' => ['icon' => 'moon', 'color' => 'slate'],
    ];

    /** @var string[] */
    private array $palette = ['blue', 'amber', 'emerald', 'orange', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'fuchsia', 'red', 'slate'];

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * @return Department[]
     */
    public function all(): array
    {
        $rows = $this->pdo->query('SELECT id, name FROM departments ORDER BY name ASC, id ASC')->fetchAll() ?: [];
        $index = 0;

        return array_map(function ($row) use (&$index) {
            $dept = new Department($row);
            $normalized = strtolower(trim($dept->name));
            $style = $this->styleMap[$normalized] ?? null;
            $color = $style['color'] ?? $this->palette[$index % count($this->palette)];
            $icon = $style['icon'] ?? 'stethoscope';
            $dept->color = $color;
            $dept->icon = $icon;
            $index++;
            return $dept;
        }, $rows);
    }
}
