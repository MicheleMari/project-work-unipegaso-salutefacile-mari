<?php

declare(strict_types=1);

use App\Core\Autoloader;
use App\Core\Config;
use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\AppointmentController;
use App\Controllers\EncounterController;
use App\Controllers\ReferenceController;
use App\Http\Request;
use App\Http\Response;

require __DIR__ . '/../src/Core/Autoloader.php';
require __DIR__ . '/../src/Core/Config.php';

Autoloader::register();
Config::load(__DIR__ . '/../config/config.php');

set_exception_handler(fn ($e) => Response::error($e));

$router = new Router(Config::get('app.base_path', ''));
$auth = new AuthController();
$encounters = new EncounterController();
$references = new ReferenceController();

$router->get('/health', fn () => Response::json(['status' => 'ok', 'timestamp' => date(DATE_ATOM)]), ['rate_limit' => ['max' => 30]]);
$router->post('/auth/login', [$auth, 'login'], ['rate_limit' => ['max' => 30]]);

$protected = ['roles' => ['operatore', 'admin', 'dottore']];

$router->get('/ps/encounters', [$encounters, 'index'], $protected);
$router->get('/ps/encounters/{id}', [$encounters, 'show'], $protected);
$router->post('/ps/encounters', [$encounters, 'store'], $protected);
$router->put('/ps/encounters/{id}', [$encounters, 'update'], $protected);
$router->patch('/ps/encounters/{id}', [$encounters, 'patch'], $protected);
$router->delete('/ps/encounters/{id}', [$encounters, 'destroy'], $protected);

$router->get('/references/departments', [$references, 'departments'], ['roles' => ['operatore', 'dottore', 'admin']]);
$router->get('/references/cadastral', [$references, 'cadastral'], ['roles' => ['operatore', 'dottore', 'admin']]);

$router->dispatch(Request::fromGlobals());
