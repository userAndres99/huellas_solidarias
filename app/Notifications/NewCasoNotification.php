<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Caso;

class NewCasoNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $caso;

    public function __construct(Caso $caso)
    {
        $this->caso = $caso;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'new_caso',
            'caso_id' => $this->caso->id,
            'author_id' => $this->caso->idUsuario,
            'author_name' => $this->caso->usuario?->name,
            'message' => ($this->caso->usuario?->name ?? 'Alguien') . ' ha hecho una nueva publicación',
            'url' => route('casos.show', $this->caso->id),
            'created_at' => $this->caso->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
