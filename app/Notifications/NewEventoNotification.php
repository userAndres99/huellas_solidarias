<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Evento;

class NewEventoNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $evento;

    public function __construct(Evento $evento)
    {
        $this->evento = $evento;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'new_evento',
            'evento_id' => $this->evento->id,
            'organizacion_id' => $this->evento->organizacion_id,
            'organizacion_name' => $this->evento->organizacion?->name ?? null,
            'message' => 'Nueva actividad publicada',
            // incluir imagen promocional (si existe) para que el frontend pueda mostrarla
            'image_url' => $this->evento->getImageUrlAttribute(),
            'url' => route('organizacion.eventos.show', $this->evento->id),
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
