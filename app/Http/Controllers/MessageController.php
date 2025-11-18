<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage; // Evento que se dispara para enviar mensajes por sockets (tiempo real)
use App\Http\Requests\StoreMessageRequest; // Request con validaciones para guardar mensajes
use App\Http\Resources\MessageResource; // Recurso que formatea los datos de los mensajes antes de enviarlos al frontend
use App\Models\Conversation; // Modelo que representa una conversación entre usuarios
use App\Models\Group; // Modelo que representa un grupo de chat
use App\Models\Message; // Modelo principal del mensaje
use App\Models\MessageAttachment; // Modelo de los archivos adjuntos del mensaje
use Illuminate\Http\Request;
use App\Models\User; // Modelo del usuario // (Parece incorrecto: debería ser Illuminate\Support\Str) para generar cadenas aleatorias
use Illuminate\Support\Facades\Storage; // Para manejar el almacenamiento de archivos
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * Cargar los mensajes de una conversación entre el usuario autenticado y otro usuario específico.
     */
    public function byUser(User $user)
    {
        // Se buscan los mensajes donde:
        // - El usuario autenticado fue el remitente y el usuario pasado es el receptor
        // - O viceversa (el usuario pasado fue el remitente y el autenticado el receptor)
        $message = Message::where('sender_id', auth()->id())
            ->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)
            ->where('receiver_id', auth()->id())
            ->latest() // Ordena del más reciente al más antiguo
            ->paginate(10); // Pagina los resultados de 10 en 10

        // Retorna una vista Inertia llamada 'Home' con los datos:
        return inertia('Chat/ChatDashboard', [
            'selectedConversation' => $user->toConversationArray(), // Info de la conversación seleccionada
            'messages' => MessageResource::collection($message), // Mensajes formateados como recurso
        ]);
    }

    /**
     * Cargar los mensajes pertenecientes a un grupo.
     */
    public function byGroup(Group $group)
    {
        // Se obtienen los mensajes del grupo indicado
        $message = Message::where('group_id', $group->id)
            ->latest() // Orden descendente por fecha
            ->paginate(10); // Paginación

        // Retorna la vista con la conversación del grupo y sus mensajes
        return inertia('Chat/ChatDashboard', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($message),
        ]);
    }

    /**
     * Cargar mensajes antiguos (anteriores a un mensaje específico).
     */
    public function loadOlder(Message $message)
    {
        // Si el mensaje pertenece a un grupo
        if ($message->group_id) {
            $messages = Message::where('created_at', '<', $message->created_at) // Mensajes más antiguos que el actual
                ->where('group_id', $message->group_id) // Del mismo grupo
                ->latest()
                ->paginate(10);
        } else {
            // Si es una conversación entre dos usuarios
            $messages = Message::where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        // También se incluyen los mensajes en dirección contraria (del receptor al emisor)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->latest()
                ->paginate(10);
        }

        // Devuelve los mensajes antiguos en formato de recurso
        return MessageResource::collection($messages);
    }

    /**
     * Guardar un nuevo mensaje (con o sin archivos adjuntos).
     */
    public function store(StoreMessageRequest $request)
    {
        // Se validan los datos de entrada usando las reglas definidas en StoreMessageRequest
        $data = $request->validated();

        // Se asigna automáticamente el ID del usuario autenticado como remitente
        $data['sender_id'] = auth()->id();

        // Se obtienen el ID del receptor o del grupo (si existen)
        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;

        // Se obtienen los archivos adjuntos enviados (si existen)
        $files = $data['attachments'] ?? [];

        // Se crea el mensaje en la base de datos
        $message = Message::create($data);

        $attachments = []; // Array para guardar los adjuntos creados

        // Si existen archivos, se recorren uno por uno
        if ($files) {
            foreach ($files as $file) {
                // Se crea un directorio aleatorio para evitar colisiones de nombres
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                // Se construye el modelo de datos del adjunto
                $model = [
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(), // Nombre original
                    'mime' => $file->getClientMimeType(), // Tipo MIME (por ejemplo: image/png)
                    'size' => $file->getSize(), // Tamaño del archivo
                    'path' => $file->store($directory, 'public'), // Se guarda en disco 'public' dentro del directorio creado
                ];

                // Se guarda el adjunto en la base de datos
                $attachment = MessageAttachment::create($model);
                $attachments[] = $attachment;
            }

            // Se añaden los adjuntos al mensaje (para devolverlos junto con el mensaje)
            $message->attachments = $attachments;
        }

        // Si el mensaje fue enviado a un usuario individual, se actualiza la conversación entre ambos
        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message);
        }

        // Si el mensaje pertenece a un grupo, se actualiza la conversación del grupo
        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }

        // Se dispara un evento SocketMessage para enviar el mensaje en tiempo real a los receptores
        SocketMessage::dispatch($message);

        // Se devuelve el mensaje recién creado formateado como recurso
        return new MessageResource($message);
    }

    /**
     * Eliminar un mensaje (solo si pertenece al usuario autenticado).
     */
    public function destroy(Message $message)
    {
        // Verifica que el usuario autenticado sea el remitente del mensaje
        if ($message->sender_id !== auth()->id()) {
            // Si no lo es, se devuelve un error 403 (prohibido)
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Elimina el mensaje
        $message->delete();

        // Retorna una respuesta vacía con código 204 (sin contenido)
        return response('', 204);
    }
}
