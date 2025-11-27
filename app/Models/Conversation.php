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
    public function messages(){
        return $this->hasMany(Message::class);
    }

    public static function getConversationsForSidebar(User $user)
    {
        // son todos los usuarios menos el autenticado
       $users = User::getUsersExceptUser($user);
       // son todos los grupos donde el usuario autenticado es miembro 
       $groups = Group::getGroupsForUser($user);

       // 
       return $users->map(function(User $user){
            return $user->toConversationArray();
       })->concat($groups->map(function (Group $group){
            return $group->toConversationArray();
       }));
    }

    

     public static function updateConversationWithMessage($userId1, $userId2, $message)
{
    // Se busca si ya existe una conversación entre los dos usuarios.
    // La búsqueda considera ambos sentidos: (user1 → user2) y (user2 → user1)
    $conversation = Conversation::where(function ($query) use ($userId1, $userId2) {
            // Primer caso: la conversación tiene los mismos IDs en el mismo orden
            $query->where('user_id1', $userId1)
                  ->where('user_id2', $userId2);
        })
        ->orWhere(function ($query) use ($userId1, $userId2) {
            // Segundo caso: los IDs están en orden inverso
            $query->where('user_id1', $userId2)
                  ->where('user_id2', $userId1);
        })
        ->first(); // Obtiene la primera coincidencia (si existe)

    // Si la conversación ya existe, se actualiza con el ID del último mensaje enviado
    if ($conversation) {
        $conversation->update([
            'last_message_id' => $message->id, // Se guarda el ID del mensaje más reciente
        ]);
    } else {
        // Si no existe, se crea una nueva conversación entre los dos usuarios
        Conversation::create([
            'user_id1' => $userId1,            // Primer participante
            'user_id2' => $userId2,            // Segundo participante
            'last_message_id' => $message->id, // Se guarda el mensaje como el más reciente
        ]);
    }
}
}
