<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Rol;

class RoleMiddleware
{
    /**
     * 
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $allowed = array_map(fn($r) => trim($r), $roles);

        // soportar tanto nombres como ids numéricos
        $roleName = $user->role_name ?? null;
        $roleId = $user->rol_id ?? null;

        $ok = false;
        if ($roleName && in_array($roleName, $allowed, true)) $ok = true;
        if ($roleId && (in_array((string)$roleId, $allowed, true) || in_array($roleId, $allowed, true))) $ok = true;

        if (! $ok) {
            abort(403, 'No tienes permisos para acceder a esta sección.');
        }

        return $next($request);
    }
}