<?php

namespace App\Core;

use App\Http\Request;
use App\Core\HttpException;
use App\Core\Config;
use App\Core\Audit;
use App\Repositories\UserRepository;

class Security
{
    private static ?Request $currentRequest = null;
    private static ?UserRepository $users = null;

    public static function setCurrentRequest(Request $request): void
    {
        self::$currentRequest = $request;
    }

    public static function getCurrentRequest(): ?Request
    {
        return self::$currentRequest;
    }

    public static function authorize(Request $request, array $allowedRoles = []): void
    {
        $authConfig = Config::get('auth', ['enabled' => false]);
        if (empty($allowedRoles)) {
            return;
        }
        if (!($authConfig['enabled'] ?? false)) {
            throw new HttpException('Unauthorized', 401);
        }

        $token = $request->getBearerToken();
        if (!$token) {
            throw new HttpException('Unauthorized', 401);
        }

        // Token statici di config
        $tokens = $authConfig['tokens'] ?? [];
        if (isset($tokens[$token])) {
            $role = $tokens[$token]['role'] ?? 'viewer';
            $hierarchy = $authConfig['roles_hierarchy'][$role] ?? [$role];
            if (empty(array_intersect($allowedRoles, $hierarchy))) {
                throw new HttpException('Forbidden', 403);
            }
            $request->setUser([
                'id' => $tokens[$token]['id'] ?? null,
                'role' => $role,
                'name' => $tokens[$token]['name'] ?? '',
                'department' => $tokens[$token]['department'] ?? null,
                'sub' => $tokens[$token]['name'] ?? '',
                'claims' => ['mode' => 'static']
            ]);
            return;
        }

        // Token derivato dalla tabella users (user_identity_code)
        self::$users ??= new UserRepository();
        $dbUser = self::$users->findByIdentityCode($token);
        if (!$dbUser) {
            throw new HttpException('Unauthorized', 401);
        }
        $role = self::mapRoleFromPermission($dbUser->permission_id, $dbUser->permission_name);
        $hierarchy = $authConfig['roles_hierarchy'][$role] ?? [$role];
        if (empty(array_intersect($allowedRoles, $hierarchy))) {
            throw new HttpException('Forbidden', 403);
        }
        $request->setUser([
            'id' => $dbUser->id,
            'role' => $role,
            'name' => $dbUser->fullName(),
            'department' => $dbUser->department,
            'sub' => $dbUser->user_identity_code,
            'claims' => ['mode' => 'db-token']
        ]);
    }

    public static function enforceRateLimit(Request $request, array $options = []): void
    {
        $config = Config::get('security.rate_limit', ['window' => 60, 'max' => 120]);
        $window = $options['rate_limit']['window'] ?? $config['window'] ?? 60;
        $max = $options['rate_limit']['max'] ?? $config['max'] ?? 120;
        $perIdentity = $options['rate_limit']['per_identity'] ?? $config['per_identity'] ?? null;

        $identity = $request->getUser()['sub'] ?? $request->getUser()['name'] ?? null;

        $key = sha1($request->getClientIp() . '|' . $request->getMethod() . '|' . $request->getPath());
        $file = sys_get_temp_dir() . '/sf_rate_' . $key . '.json';
        $userFile = $identity ? sys_get_temp_dir() . '/sf_rate_user_' . sha1($identity) . '.json' : null;

        $now = time();
        $hits = [];
        if (is_file($file)) {
            $content = file_get_contents($file);
            $decoded = json_decode($content ?: '[]', true);
            $hits = is_array($decoded) ? array_filter($decoded, fn ($ts) => ($now - (int) $ts) < $window) : [];
        }

        $userHits = [];
        if ($userFile && is_file($userFile)) {
            $content = file_get_contents($userFile);
            $decoded = json_decode($content ?: '[]', true);
            $userHits = is_array($decoded) ? array_filter($decoded, fn ($ts) => ($now - (int) $ts) < $window) : [];
        }

        if (count($hits) >= $max) {
            throw new HttpException('Too Many Requests', 429);
        }
        if ($perIdentity && $identity && count($userHits) >= $perIdentity) {
            throw new HttpException('Too Many Requests', 429);
        }

        $hits[] = $now;
        file_put_contents($file, json_encode($hits), LOCK_EX);
        if ($userFile) {
            $userHits[] = $now;
            file_put_contents($userFile, json_encode($userHits), LOCK_EX);
        }
    }

    public static function log(int $status, array $context = []): void
    {
        $path = Config::get('logging.path');
        if (!$path) {
            return;
        }

        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        Audit::log($status, $context);
    }

    private static function mapRoleFromPermission(int $permissionId, ?string $permissionName): string
    {
        $name = strtolower($permissionName ?? '');
        if ($permissionId === 1 || str_contains($name, 'operatore')) {
            return 'operatore';
        }
        if ($permissionId === 2 || str_contains($name, 'spec')) {
            return 'dottore';
        }
        return 'admin';
    }
}
