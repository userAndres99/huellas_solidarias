<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;

class ConversationController extends Controller
{
    public function start(Request $request)
    {
        $user = auth()->user();
        $otherId = $request->user_id;

        // buscar si ya existe
        $existing = Conversation::between($user->id, $otherId);

        if ($existing) {
            return redirect()->route('chat.user', $otherId);
        }

        // crear conversación nueva
        $conversation = Conversation::create([
            'user_id1' => $user->id,
            'user_id2' => $otherId,
        ]);

        return redirect()->route('chat.user', $otherId);
    }

    public function hide(Request $request, $otherUserId)
    {
        $user = auth()->user();

        try {
            // crear o actualizar registro de oculto
            \App\Models\ConversacionOculta::firstOrCreate([
                'user_id' => $user->id,
                'otro_user_id' => $otherUserId,
            ]);

            return response()->json(['message' => 'Conversación eliminada de tu lista.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al ocultar la conversación.'], 500);
        }
    }

    public function unhide(Request $request, $otherUserId)
    {
        $user = auth()->user();

        try {
            \App\Models\ConversacionOculta::where('user_id', $user->id)
                ->where('otro_user_id', $otherUserId)
                ->delete();

            return response()->json(['message' => 'Conversación restaurada.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al restaurar la conversación.'], 500);
        }
    }

    /**
     * Marcar una conversación (usuario o grupo) como leída para el usuario autenticado.
     * Tipo: 'user' o 'group'
     */
    public function marcarLeida(Request $request, $tipo, $id)
    {
        $user = $request->user();
        if (! $user) return response()->json(['message' => 'No autorizado'], 401);

        try {
            $clave = null;
            if ($tipo === 'user') {
                $clave = 'u_' . (int)$id;
            } elseif ($tipo === 'group') {
                $clave = 'g_' . (int)$id;
            } else {
                return response()->json(['message' => 'Tipo inválido'], 400);
            }

            \Illuminate\Support\Facades\DB::table('actividad_conversaciones')->updateOrInsert(
                ['usuario_id' => $user->id, 'clave' => $clave],
                ['ultimo_visto' => now(), 'updated_at' => now(), 'created_at' => now()]
            );

            return response()->json(['message' => 'Marcado como leído'], 200);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Error marcando leído'], 500);
        }
    }
}
