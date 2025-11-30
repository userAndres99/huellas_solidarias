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
}
