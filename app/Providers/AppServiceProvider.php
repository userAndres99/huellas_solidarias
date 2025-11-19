<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // forzar HTTPS 
        try {
            $appUrl = config('app.url', env('APP_URL')) ?? '';
            $forceEnv = filter_var(env('FORCE_HTTPS', false), FILTER_VALIDATE_BOOLEAN);
            $isAppUrlHttps = str_starts_with($appUrl, 'https://');

            // Determina el host de la solicitud de manera segura
            $host = '';
            try {
                $host = request()?->getHost() ?? '';
            } catch (\Throwable $_) {
                $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
            }

            $isLoopback = in_array($host, ['127.0.0.1', '::1', 'localhost', '[::1]'], true);

            if (($forceEnv || $isAppUrlHttps) && !$isLoopback) {
                URL::forceScheme('https');
            }
        } catch (\Throwable $e) {
            // no hacer nada si falla
        }

        // Compartir notificaciones y contador 
        Inertia::share([
            'auth.user.unread_notifications_count' => function () {
                try {
                    return auth()->check() ? auth()->user()->unreadNotifications()->count() : 0;
                } catch (\Throwable $_) {
                    return 0;
                }
            },
            'auth.user.recent_notifications' => function () {
                try {
                    if (!auth()->check()) return [];
                    return auth()->user()->notifications()->latest()->limit(10)->get()->map(function ($n) {
                        return [
                            'id' => $n->id,
                            'data' => $n->data,
                            'read_at' => $n->read_at,
                            'created_at' => $n->created_at,
                        ];
                    })->values();
                } catch (\Throwable $_) {
                    return [];
                }
            }
        ]);
    }
}
