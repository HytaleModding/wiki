<?php

use App\Http\Middleware\AuthenticateAPIKey;
use App\Http\Middleware\EnsureAPIScope;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsureAccountActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveModByDomain;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'verified.email' => EnsureEmailIsVerified::class,
            'api.scope' => EnsureAPIScope::class,
            'api.key' => AuthenticateAPIKey::class,
            'mod.domain' => ResolveModByDomain::class,
            'platform.admin' => EnsurePlatformAdmin::class,
            'account.active' => EnsureAccountActive::class,
        ]);

        $middleware->web(
            append: [
                HandleAppearance::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ],
            prepend: [
                ResolveModByDomain::class,
            ]
        );

        $middleware->api(append: [
            AuthenticateAPIKey::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();
