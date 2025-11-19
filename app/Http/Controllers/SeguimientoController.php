<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class SeguimientoController extends Controller
{
    public function store(Request $request, User $user)
    {
        $auth = $request->user();
        if (!$auth || $auth->id === $user->id) {
            return response()->json(['message' => 'Operación no permitida'], 403);
        }

        $auth->seguir($user);

        return response()->json([
            'following' => true,
            'followers_count' => $user->seguidores()->count(),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $auth = $request->user();
        if (!$auth || $auth->id === $user->id) {
            return response()->json(['message' => 'Operación no permitida'], 403);
        }

        $auth->dejarSeguir($user);

        return response()->json([
            'following' => false,
            'followers_count' => $user->seguidores()->count(),
        ]);
    }
}
