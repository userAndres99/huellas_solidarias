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
}
