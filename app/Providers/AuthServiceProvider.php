<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // null-safe: acepta usuario null sin romper
        Gate::define('is-admin', fn(?User $user) => $user?->role === User::ROLE_ADMIN);

        // o, alternativa: permitir que los admins pasen cualquier gate
        Gate::before(function (?User $user, $ability) {
            return $user && $user->isAdmin() ? true : null;
        });
    }
}