<?php

namespace App\Events;

use App\Http\Resources\MessageResource; // Recurso que formatea el mensaje antes de enviarlo
use App\Models\Message; // Modelo del mensaje
use Illuminate\Broadcasting\Channel; // Clase base para los canales de broadcasting
use Illuminate\Broadcasting\InteractsWithSockets; // Trait para manejar la interacción con sockets
use Illuminate\Broadcasting\PresenceChannel; // Canal de presencia (permite saber quién está conectado)
use Illuminate\Broadcasting\PrivateChannel; // Canal privado (solo accesible por usuarios autorizados)
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; // Indica que el evento debe transmitirse por broadcasting
use Illuminate\Foundation\Events\Dispatchable; // Trait que permite despachar el evento fácilmente
use Illuminate\Queue\SerializesModels; // Trait que serializa los modelos para que puedan transmitirse

class SocketMessage implements ShouldBroadcast
{
    // Traits utilizados por el evento:
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Constructor del evento.
     * 
     * Recibe una instancia del modelo Message que será transmitida.
     */
    public function __construct(public Message $message)
    {
        // No se necesita código adicional aquí; Laravel manejará la inyección automática del modelo.
    }

    /**
     * Define los datos que se enviarán a los clientes cuando el evento sea transmitido.
     */
    public function broadcastWith(): array
    {
        return [
            // Se envía el mensaje formateado usando MessageResource para mantener consistencia con la API
            'message' => new MessageResource($this->message),
        ];
    }

    /**
     * Define en qué canales se emitirá el evento.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Se guarda el mensaje en una variable corta
        $m = $this->message;

        // Se crea un array para almacenar los canales a los que se transmitirá el evento
        $channels = [];

        // Si el mensaje pertenece a un grupo
        if ($m->group_id) {
            // Se emite en un canal privado con el ID del grupo
            // Ejemplo: message.group.5
            $channels[] = new PrivateChannel('message.group.' . $m->group_id);
        } else {
            // Si el mensaje es entre dos usuarios (chat privado)
            // Se crea un canal de presencia con ambos IDs ordenados para que ambos usuarios compartan el mismo canal
            // Ejemplo: message.user.3-7
            $channels[] = new PrivateChannel(
                'message.user.' . collect([$m->sender_id, $m->receiver_id])->sort()->implode('-')
            );
        }

        // Se devuelven los canales por los que se transmitirá el mensaje
        return $channels;
    }
}
