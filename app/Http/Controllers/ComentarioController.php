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
            ->with('user', 'respuesta')
            ->get();

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
        $data['usuario_avatar'] = auth()->user()->avatar ?? '/default.png';

        Comentario::create($data);

        // Devolver todos los comentarios actualizados
        $comentarios = Comentario::where('comentable_id', $data['comentable_id'])
            ->where('comentable_type', $data['comentable_type'])
            ->with('user', 'respuesta')
            ->get();


        // Si la petición es XHR (fetch/AJAX), devolvemos JSON
    if ($request->wantsJson() || $request->ajax()) {
        return response()->json($comentarios);
    }
        return response()->json($comentarios);
    }
}
