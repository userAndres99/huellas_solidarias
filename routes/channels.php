<?php

use Illuminate\Support\Facades\Broadcast; // Facade que permite registrar canales de broadcasting
use App\Http\Resources\UserResource; // Recurso que formatea los datos del usuario antes de enviarlos
use App\Models\User; // Modelo del usuario

/**
 * Canal de broadcasting general para usuarios "online".
 * 
 * Este canal permite saber qué usuarios están conectados actualmente
 * (por ejemplo, para mostrar una lista de contactos en línea en el chat).
 */
Broadcast::channel('online', function (User $user) {
    // Si el usuario está autenticado, se devuelve su información formateada.
    // Caso contrario, se devuelve null (no tiene acceso al canal).
    return $user ? new UserResource($user) : null;
});


/**
 * Canal de broadcasting para chats privados entre dos usuarios.
 * 
 * El nombre del canal incluye ambos IDs de usuario, por ejemplo:
 *  message.user.3-7
 * 
 * Solo los dos usuarios involucrados en la conversación pueden unirse al canal.
 */
Broadcast::channel('message.user.{userId1}-{userId2}', function (User $user, int $userId1, int $userId2) {
    // Se permite el acceso solo si el usuario autenticado es uno de los dos participantes
    return $user->id === $userId1 || $user->id === $userId2
        ? $user  // Si pertenece al canal, se devuelve el usuario autenticado
        : null;  // Si no, se deniega el acceso
});


/**
 * Canal de broadcasting para grupos de chat.
 * 
 * El nombre del canal incluye el ID del grupo, por ejemplo:
 *  message.group.5
 * 
 * Solo los usuarios que pertenecen al grupo pueden recibir los mensajes del canal.
 */
Broadcast::channel('message.group.{groupId}', function (User $user, int $groupId) {
    // Verifica si el usuario pertenece al grupo mediante la relación 'groups'
    // (se asume que $user->groups es una relación Many-to-Many con el modelo Group)
    return $user->groups->contains('id', $groupId)
        ? $user  // Si pertenece al grupo, se devuelve el usuario autenticado
        : null;  // Si no pertenece, se deniega el acceso
});
Broadcast::channel('group.deleted.{groupId}', function (User $user, int $groupId) {
    return $user->groups->contains('id', $groupId);  
});


/**
 * Canal privado para notificaciones de usuario.
 */
Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id ? $user : null;
});
