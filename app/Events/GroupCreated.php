<?php

namespace App\Events;

use App\Models\Group;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Group $group)
    {
    }

    public function broadcastOn(): array
    {
        // Emitimos a todos los usuarios que pertenecen al grupo
        return $this->group->users->map(fn($user) => new PrivateChannel("group.created.{$user->id}"))->toArray();
    }

    public function broadcastWith(): array
    {
        return [
            'group' => [
                'id' => $this->group->id,
                'name' => $this->group->name,
                'user_ids' => $this->group->users->pluck('id'),
            ],
        ];
    }
}
