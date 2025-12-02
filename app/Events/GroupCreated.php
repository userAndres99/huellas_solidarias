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
        return $this->group->users->flatMap(function($user) {
            return [
                new PrivateChannel("group.created.{$user->id}"),
                new PrivateChannel("App.Models.User.{$user->id}"),
            ];
        })->toArray();
    }

    public function broadcastWith(): array
    {
        return [
            'group' => [
                'id' => $this->group->id,
                'name' => $this->group->name,
                'user_ids' => $this->group->users->pluck('id'),
                'owner_id' => $this->group->owner_id,
                'users' => $this->group->users->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            ],
        ];
    }
}
