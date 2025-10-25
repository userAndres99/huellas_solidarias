<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Comentario;

class ComentarioController extends Controller
{
    // Devuelve comentarios para un item comentable
    public function index(Request $request)
    {
        $comentableId = $request->comentable_id;
        $comentableType = $request->comentable_type;

        $comentarios = Comentario::where('comentable_id', $comentableId)
            ->where('comentable_type', $comentableType)
            ->whereNull('parent_id')
            ->with('user', 'respuesta.user')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'user_id' => $c->user_id,
                    'usuario_nombre' => $c->user->name ?? $c->usuario_nombre ?? 'Invitado',
                    'usuario_avatar' => $c->user
                        ? ($c->user->profile_photo_url . '?v=' . ($c->user->updated_at ? $c->user->updated_at->timestamp : time()))
                        : ($c->usuario_avatar ?? '/images/DefaultPerfil.jpg'),
                    'texto' => $c->texto,
                    'parent_id' => $c->parent_id,
                    'likes' => $c->likes,
                    'respuesta' => $c->respuesta ?? [],
                    'created_at' => $c->created_at ? $c->created_at->toIsoString() : now()->toIsoString(),
                ];
            });

        return response()->json($comentarios);
    }

    // Guardar comentario nuevo
    public function store(Request $request)
    {
        $data = $request->validate([
            'comentable_id' => 'required|integer',
            'comentable_type' => 'required|string',
            'texto' => 'required|string',
            'parent_id' => 'nullable|integer|exists:comentarios,id',
        ]);

        $data['user_id'] = auth()->id();
        $data['usuario_nombre'] = auth()->user()->name ?? 'Invitado';
    $data['usuario_avatar'] = auth()->user()->avatar ?? '/images/DefaultPerfil.jpg';

        Comentario::create($data);

        // Devolver todos los comentarios actualizados
        $comentarios = Comentario::where('comentable_id', $data['comentable_id'])
            ->where('comentable_type', $data['comentable_type'])
            ->with('user', 'respuesta')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'user_id' => $c->user_id,
                    'usuario_nombre' => $c->user->name ?? $c->usuario_nombre ?? 'Invitado',
                    'usuario_avatar' => $c->user->avatar ?? $c->usuario_avatar ?? '/images/DefaultPerfil.jpg',
                    'texto' => $c->texto,
                    'parent_id' => $c->parent_id,
                    'likes' => $c->likes,
                    'respuesta' => $c->respuesta ?? [],
                    'created_at' => $c->created_at ? $c->created_at->toIsoString() : now()->toIsoString(),
                ];
            });


        // Si la petición es XHR (fetch/AJAX), devolvemos JSON
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json($comentarios);
        }
        return response()->json($comentarios);
    }
}
