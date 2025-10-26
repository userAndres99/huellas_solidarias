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
        $user = auth()->user();

        $mapRespuesta = function($r) use ($user, &$mapRespuesta) {
            return [
                'id' => $r->id,
                'user_id' => $r->user_id,
                'usuario_nombre' => $r->user->name ?? $r->usuario_nombre ?? 'Invitado',
                'usuario_avatar' => $r->user
                    ? ($r->user->profile_photo_url . '?v=' . ($r->user->updated_at ? $r->user->updated_at->timestamp : time()))
                    : ($r->usuario_avatar ?? '/images/DefaultPerfil.jpg'),
                'texto' => $r->texto,
                'parent_id' => $r->parent_id,
                'likes_count' => $r->likesUsers()->count(),
                'liked_by_current_user' => $user ? $r->likesUsers()->where('user_id', $user->id)->exists() : false,
                'respuesta' => $r->respuesta ? $r->respuesta->map($mapRespuesta) : [],
                'created_at' => $r->created_at ? $r->created_at->toIsoString() : now()->toIsoString(),
            ];
        };

        return [
            'id' => $c->id,
            'user_id' => $c->user_id,
            'usuario_nombre' => $c->user->name ?? $c->usuario_nombre ?? 'Invitado',
            'usuario_avatar' => $c->user
                ? ($c->user->profile_photo_url . '?v=' . ($c->user->updated_at ? $c->user->updated_at->timestamp : time()))
                : ($c->usuario_avatar ?? '/images/DefaultPerfil.jpg'),
            'texto' => $c->texto,
            'parent_id' => $c->parent_id,
            'likes_count' => $c->likesUsers()->count(),
            'liked_by_current_user' => $user ? $c->likesUsers()->where('user_id', $user->id)->exists() : false,
            'respuesta' => $c->respuesta ? $c->respuesta->map($mapRespuesta) : [],
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



    public function like($id)
    {
        $user = auth()->user();
    if (!$user) return response()->json(['message' => 'No autorizado'], 401);

    $comentario = Comentario::findOrFail($id);

    if ($comentario->likesUsers()->where('user_id', $user->id)->exists()) {
        $comentario->likesUsers()->detach($user->id);
    } else {
        $comentario->likesUsers()->attach($user->id);
    }

    return response()->json([
        'likes_count' => $comentario->likesUsers()->count(),
        'liked_by_current_user' => $comentario->likesUsers()->where('user_id', $user->id)->exists(),
    ]);
    }




    // Actualizar comentario

    public function update(Request $request, $id)
    {
        $comentario = Comentario::findOrFail($id);
        $user = auth()->user();


        // solo el autor puede editar
        if (!$user || $comentario->user_id !== $user->id){
            return response()->json(['message' =>  'No autorizado'],403);
        }


        $data = $request->validate([
            'texto' => 'required|string',
        ]);

        $comentario->update([
            'texto' => $data['texto'],
        ]);
        return response()->json(['message' =>'Comentario actualizado', 'comentario' => $comentario]);
    }



    // Eliminar un comentario

    public function destroy($id)
    {
        $comentario = Comentario::findOrFail($id);
        $user = auth()->user();


        // Solo el autor puede eliminar

        if (!$user || $comentario->user_id !== $user->id)
        {
            return response()->json(['message' => 'No autorizado'],403);
        }

        // si tiene respuesta, podemos eliminarlas tambien
        $this -> deleteRecursively($comentario);

        return response()->json(['message'=>'Comentario eliminado']);
    }




    public function deleteRecursively(Comentario $comentario)
    {
        foreach ($comentario->respuesta as $r){
            $this ->deleteRecursively($r);
        }
        $comentario->delete();
    }
}
