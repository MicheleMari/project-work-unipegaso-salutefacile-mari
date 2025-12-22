<?php

namespace App\Core;

class Jwks
{
    public static function fetch(string $uri, int $ttl = 3600): array
    {
        $cacheFile = sys_get_temp_dir() . '/sf_jwks_' . md5($uri) . '.json';
        if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
            $cached = json_decode(file_get_contents($cacheFile) ?: '[]', true);
            if (is_array($cached) && isset($cached['keys'])) {
                return $cached['keys'];
            }
        }

        $json = @file_get_contents($uri);
        if ($json === false) {
            if (is_file($cacheFile)) {
                $cached = json_decode(file_get_contents($cacheFile) ?: '[]', true);
                if (is_array($cached) && isset($cached['keys'])) {
                    return $cached['keys'];
                }
            }
            throw new HttpException('Unable to fetch JWKS', 401);
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded) || !isset($decoded['keys'])) {
            throw new HttpException('Invalid JWKS', 401);
        }

        file_put_contents($cacheFile, $json);
        return $decoded['keys'];
    }

    public static function findKey(array $jwks, string $kid): ?array
    {
        foreach ($jwks as $jwk) {
            if (($jwk['kid'] ?? '') === $kid) {
                return $jwk;
            }
        }
        return null;
    }
}
