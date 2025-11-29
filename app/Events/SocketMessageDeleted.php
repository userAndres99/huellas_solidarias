<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocketMessageDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public array $payload;

    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }

    public function broadcastOn(): array
    {
        $p = $this->payload['deletedMessage'] ?? null;
        $channels = [];
        if (! $p) return $channels;

        if (! empty($p['group_id'])) {
            $channels[] = new PrivateChannel('message.group.' . $p['group_id']);
        } else {
            $channels[] = new PrivateChannel(
                'message.user.' . collect([$p['sender_id'], $p['receiver_id']])->sort()->implode('-')
            );
        }

        return $channels;
    }
}
