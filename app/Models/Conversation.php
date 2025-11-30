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
        // Todas las conversaciones donde el usuario participe
        $conversations = Conversation::where('user_id1', $user->id)
            ->orWhere('user_id2', $user->id)
            ->with(['user1', 'user2', 'lastMessage'])
            ->get();

        // Grupos donde el usuario es miembro
        $groups = Group::getGroupsForUser($user);

        // Transformamos todo al formato del sidebar
        return $conversations->map(function (Conversation $conversation) use ($user) {
            return $conversation->toConversationArrayFor($user);
        })->concat(
            $groups->map(function (Group $group) {
                return $group->toConversationArray();
            })
        );
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

        return [
            'is_user' => true,
            'is_group' => false,

            // El front espera "id" para navegar
            'id' => $otherUser->id,

            // Nombre + avatar del usuario
            'name' => $otherUser->name,
            'avatar' => $otherUser->avatar ?? null,

            // Último mensaje
            'last_message' => $this->lastMessage?->message,
            'last_message_date' => $this->lastMessage?->created_at,

            // Información para navegación
            'conversation_id' => $this->id,
            'with_user_id' => $otherUser->id,
        ];
    }
}
