<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    //

    use HasFactory;

    protected $fillable = [
        'user_id1',
        'user_id2',
        'last_message_id',
    ];


    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function user1()
    {
        return $this->belongsTo(User::class, 'user_id1');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user_id2');
    }
    public function messages()
    {
        return $this->hasMany(Message::class, 'conversation_id');
    }

    public static function between($id1, $id2)
    {
        return self::where(function ($q) use ($id1, $id2) {
            $q->where('user_id1', $id1)->where('user_id2', $id2);
        })
            ->orWhere(function ($q) use ($id1, $id2) {
                $q->where('user_id1', $id2)->where('user_id2', $id1);
            })
            ->first(); // 🔥 se devuelve la conversación o null
    }







    public static function getConversationsForSidebar(User $user)
    {
        // Obtener IDs de conversaciones ocultas por el usuario 
        $hiddenIds = [];
        try {
            if (class_exists(\App\Models\ConversacionOculta::class)) {
                $hiddenIds = \App\Models\ConversacionOculta::where('user_id', $user->id)->pluck('otro_user_id')->toArray();
            }
        } catch (\Exception $e) {
            $hiddenIds = [];
        }

        // Todas las conversaciones donde el usuario participe
        $conversations = Conversation::where('user_id1', $user->id)
            ->orWhere('user_id2', $user->id)
            ->with(['user1', 'user2', 'lastMessage'])
            ->get();

        // Grupos donde el usuario es miembro
        $groups = Group::getGroupsForUser($user);

        // Transformamos todo al formato del sidebar y filtramos ocultas
        $mapped = $conversations->map(function (Conversation $conversation) use ($user) {
            return $conversation->toConversationArrayFor($user);
        })->filter(function ($conv) use ($hiddenIds) {
            return !in_array($conv['id'], $hiddenIds);
        })->values();

        $groupMapped = $groups->map(function (Group $group) use ($user) {
            $arr = $group->toConversationArray();
            try {
                if (isset($group->last_message_sender_id) && $group->last_message_sender_id == $user->id) {
                    $arr['last_message'] = 'Yo: ' . ($arr['last_message'] ?? '');
                }
            } catch (\Throwable $e) {
                
            }
            return $arr;
        });

        // Combinar las conversaciones de usuarios y los grupos 
        $combined = $mapped->concat($groupMapped)
            ->sortByDesc(function ($conv) {
                try {
                    $date = $conv['last_message_date'] ?? $conv['created_at'] ?? null;
                    if (!$date) return 0;
                    
                    if (is_object($date) && method_exists($date, 'getTimestamp')) return $date->getTimestamp();
                   
                    $ts = strtotime((string)$date);
                    return $ts ? $ts : 0;
                } catch (\Throwable $e) {
                    return 0;
                }
            })
            ->values();

        return $combined;
    }



    public static function updateConversationWithMessage($userId1, $userId2, $message)
    {
        $conversation = Conversation::where(function ($query) use ($userId1, $userId2) {
            $query->where('user_id1', $userId1)
                ->where('user_id2', $userId2);
        })
            ->orWhere(function ($query) use ($userId1, $userId2) {
                $query->where('user_id1', $userId2)
                    ->where('user_id2', $userId1);
            })
            ->first();

        if ($conversation) {
            $conversation->update([
                'last_message_id' => $message->id,
            ]);
        } else {
            Conversation::create([
                'user_id1' => $userId1,
                'user_id2' => $userId2,
                'last_message_id' => $message->id,
            ]);
        }
    }

    public function toConversationArrayFor(User $authUser)
    {
        $otherUser = $this->user_id1 == $authUser->id
            ? $this->user2
            : $this->user1;
        // Formatear el último mensaje para la vista 
        $lastMessageText = null;
        $lastMessageDate = null;
        if ($this->lastMessage) {
            $lastMessageDate = $this->lastMessage->created_at;
            try {
                $lastMessageText = $this->lastMessage->message;
                if ($this->lastMessage->sender_id == $authUser->id) {
                    $lastMessageText = 'Yo: ' . ($lastMessageText ?? '');
                }
            } catch (\Throwable $e) {
                // seguro fallback
                $lastMessageText = $this->lastMessage->message ?? null;
            }
        }

        return [
            'is_user' => true,
            'is_group' => false,

            // El front espera "id" para navegar
            'id' => $otherUser->id,

            // Nombre + avatar del usuario
            'name' => $otherUser->name,
            'avatar' => $otherUser->avatar ?? null,
            
            'avatar_url' => $otherUser->profile_photo_path ? \Illuminate\Support\Facades\Storage::url($otherUser->profile_photo_path) : ($otherUser->profile_photo_url ?? null),

            // Último mensaje (formateado)
            'last_message' => $lastMessageText,
            'last_message_date' => $lastMessageDate,

            // Información para navegación
            'conversation_id' => $this->id,
            'with_user_id' => $otherUser->id,
        ];
    }
}
