<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'image',
        'last_message_id',
    ];


    public function users()
    {
        return $this->belongsToMany(User::class, 'group_users');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class);
    }

    public function lastMessage()
    {
        return $this -> belongsTo(Message::class, 'last_message_id');    
    }



public static function getGroupsForUser(User $user)
    {
        /**
         * self hace referencia al modelo actual (Group)
         * Pide: 
         * Todos los campos de la tabla groups (groups.*)
         * El texto del último mensaje del grupo (messages.message)
         * la fecha en la que se envió ese mensaje (messages.created_at)
         */
        $query = self::select(['groups.*', 'messages.message as last_message', 'messages.created_at as last_message_date'])
        // La tabla group_users es la tabla intermedia que indic qué usuarios pertenecen a qué grupos.
        ->join('group_users', 'group_users.group_id', '=', 'groups.id')
        /**
         * Esto une la tabla messages para poder incluir el último mensaje de cada grupo
         * Se usa LEFT JOIN para que tambien aparezcan los grupos que todavía no tienen mensajes (así no se excluyen).
         */
        ->leftJoin('messages', 'messages.id', '=', 'groups.last_message_id')
        // Solo devuelve los grupos donde el usuario está en la tabla group_users.
        ->where('group_users.user_id', '=', $user->id)
        /**
         * Ordena:
         * Primero, por fecha del último mensaje (los más recientes arriba).
         * Si hya grupos sin mensajes o con la misma fecha, se ordenan por nombre alfabéticamente
         */
        ->orderBy('messages.created_at', 'desc')
        ->orderBy('groups.name');

        return $query->get();
    }


    public function toConversationArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'is_group' => true,
            'is_user' => false,
            'owner_id' => $this->owner_id,
            'user_ids' => $this->users->pluck('id'),
            'created_at' => $this->created_at, 
            'updated_at' => $this->updated_at,
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date,

        ];
    }


    public static function updateGroupWithMessage($groupId, $message)
{
    // Este método actualiza o crea un registro de grupo
    // asignando el último mensaje enviado a ese grupo.

    return self::updateOrCreate(
        // Condición de búsqueda: busca un grupo con el ID indicado
        ['id' => $groupId],

        // Si existe, actualiza el campo 'last_message_id' con el nuevo mensaje.
        // Si no existe, crea el grupo con ese 'id' y ese 'last_message_id'.
        ['last_message_id' => $message->id]
    );
}

}
