<?php

namespace App\Core;

use App\Http\Request;
use App\Http\Response;
use App\Core\Security;

class Router
{
    private array $routes = [];
    private string $basePath;

    public function __construct(string $basePath = '')
    {
        $this->basePath = rtrim($basePath, '/');
    }

    public function get(string $path, callable $handler, array $options = []): void
    {
        $this->addRoute('GET', $path, $handler, $options);
    }

    public function post(string $path, callable $handler, array $options = []): void
    {
        $this->addRoute('POST', $path, $handler, $options);
    }

    public function put(string $path, callable $handler, array $options = []): void
    {
        $this->addRoute('PUT', $path, $handler, $options);
    }

    public function patch(string $path, callable $handler, array $options = []): void
    {
        $this->addRoute('PATCH', $path, $handler, $options);
    }

    public function delete(string $path, callable $handler, array $options = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $options);
    }

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        if ($method === 'OPTIONS') {
            Response::options();
        }

        $path = $this->stripBasePath($request->getPath());
        $routes = $this->routes[$method] ?? [];

        Security::setCurrentRequest($request);

        foreach ($routes as $route) {
            if (preg_match($route['regex'], $path, $matches)) {
                $params = [];
                foreach ($route['params'] as $index => $name) {
                    $params[$name] = $matches[$index + 1] ?? null;
                }
                Security::enforceRateLimit($request, $route['options'] ?? []);
                if (!empty($route['options']['roles'] ?? [])) {
                    Security::authorize($request, $route['options']['roles']);
                }
                $handler = $route['handler'];
                $handler($request, $params);
                return;
            }
        }

        Response::json(['error' => 'Not Found'], 404);
    }

    private function addRoute(string $method, string $path, callable $handler, array $options = []): void
    {
        $normalized = $path === '/' ? '/' : '/' . trim($path, '/');
        $params = [];
        $regex = preg_replace_callback('/\{([^}]+)\}/', function ($matches) use (&$params) {
            $params[] = $matches[1];
            return '([^/]+)';
        }, $normalized);
        $pattern = '#^' . $regex . '$#';

        $this->routes[$method][] = [
            'regex' => $pattern,
            'params' => $params,
            'handler' => $handler,
            'options' => $options,
        ];
    }

    private function stripBasePath(string $path): string
    {
        if ($this->basePath && strpos($path, $this->basePath) === 0) {
            $stripped = substr($path, strlen($this->basePath));
            return $stripped ? $stripped : '/';
        }

        return $path ?: '/';
    }
}
