<?php

namespace App\Events;

use App\Http\Resources\GroupResource;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;


class GroupDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Crea una nueva instancia del evento.
     */
    public function __construct(public int $id, public string $name, public array $userIds = [])
    {
        //
    }

  

    /**
     * Obtiene los canales en los que se debe transmitir el evento.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('group.deleted.' . $this->id)];

        try {
            foreach ($this->userIds as $uid) {
                $channels[] = new PrivateChannel("App.Models.User.{$uid}");
            }
        } catch (\Throwable $e) {
            
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'user_ids' => $this->userIds,
        ];
    }
}
