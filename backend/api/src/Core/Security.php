<?php

namespace App\Core;

use App\Http\Request;
use App\Core\HttpException;
use App\Core\Config;
use App\Core\Jwks;

class Security
{
    private static ?Request $currentRequest = null;

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

        $mode = $authConfig['mode'] ?? 'oidc';
        if ($mode === 'oidc') {
            $user = self::validateOidcToken($token, $authConfig['oidc'] ?? []);
            $role = $user['role'] ?? 'viewer';
            $hierarchy = $authConfig['roles_hierarchy'][$role] ?? [$role];
            if (empty(array_intersect($allowedRoles, $hierarchy))) {
                throw new HttpException('Forbidden', 403);
            }
            $request->setUser([
                'role' => $role,
                'name' => $user['name'] ?? '',
                'sub' => $user['sub'] ?? '',
                'claims' => $user
            ]);
        } elseif ($mode === 'static') {
            $tokens = $authConfig['tokens'] ?? [];
            if (!isset($tokens[$token])) {
                throw new HttpException('Unauthorized', 401);
            }
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
        }
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

    private static function validateOidcToken(string $jwt, array $oidc): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new HttpException('Invalid token', 401);
        }
        [$h64, $p64, $s64] = $parts;
        $header = json_decode(self::b64($h64), true);
        $payload = json_decode(self::b64($p64), true);

        if (!is_array($header) || !is_array($payload)) {
            throw new HttpException('Invalid token', 401);
        }

        $alg = $header['alg'] ?? '';
        $kid = $header['kid'] ?? '';
        if ($alg !== 'RS256') {
            throw new HttpException('Unsupported alg', 401);
        }

        $issuer = $oidc['issuer'] ?? '';
        $aud = $oidc['audience'] ?? '';
        if (($payload['iss'] ?? '') !== $issuer || (!in_array($aud, (array) ($payload['aud'] ?? []), true))) {
            throw new HttpException('Invalid issuer/audience', 401);
        }
        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            throw new HttpException('Token expired', 401);
        }

        $jwks = Jwks::fetch($oidc['jwks_uri'] ?? '', (int) ($oidc['cache_ttl'] ?? 3600));
        $jwk = Jwks::findKey($jwks, $kid);
        if (!$jwk) {
            throw new HttpException('Signing key not found', 401);
        }

        $pubKey = self::jwkToPem($jwk);
        $data = $h64 . '.' . $p64;
        $signature = base64_decode(strtr($s64, '-_', '+/'));

        $ok = openssl_verify($data, $signature, $pubKey, OPENSSL_ALGO_SHA256);
        if ($ok !== 1) {
            throw new HttpException('Invalid signature', 401);
        }

        $rolesClaim = $oidc['roles_claim'] ?? 'roles';
        $role = 'viewer';
        if (isset($payload[$rolesClaim])) {
            $roles = is_array($payload[$rolesClaim]) ? $payload[$rolesClaim] : explode(' ', (string) $payload[$rolesClaim]);
            $role = $roles[0] ?? 'viewer';
        }

        return array_merge($payload, ['role' => $role]);
    }

    private static function b64(string $data): string
    {
        $rem = strlen($data) % 4;
        if ($rem) {
            $data .= str_repeat('=', 4 - $rem);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    private static function jwkToPem(array $jwk): string
    {
        $n = self::b64($jwk['n'] ?? '');
        $e = self::b64($jwk['e'] ?? '');
        $modulus = self::toBigInt($n);
        $exponent = self::toBigInt($e);

        $rsa = "\x30" . self::encLength(strlen($modulus) + strlen($exponent) + 4)
            . "\x02" . self::encLength(strlen($modulus)) . $modulus
            . "\x02" . self::encLength(strlen($exponent)) . $exponent;
        $seq = "\x30" . self::encLength(strlen($rsa)) . $rsa;
        $bitstring = "\x03" . self::encLength(strlen($seq) + 1) . "\x00" . $seq;

        $algId = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00";
        $pubKey = "\x30" . self::encLength(strlen($algId) + strlen($bitstring)) . $algId . $bitstring;

        return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($pubKey), 64, "\n") . "-----END PUBLIC KEY-----\n";
    }

    private static function toBigInt(string $bytes): string
    {
        return "\x00" . $bytes;
    }

    private static function encLength(int $length): string
    {
        if ($length < 128) {
            return chr($length);
        }
        $lenBytes = ltrim(pack('N', $length), "\x00");
        return chr(0x80 | strlen($lenBytes)) . $lenBytes;
    }
}
