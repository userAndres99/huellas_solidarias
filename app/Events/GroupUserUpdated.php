<?php

namespace App\Events;

use App\Models\Group;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class GroupUserUpdated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $group;
    public $userIds; // Nuevos usuarios (para compatibilidad)
    public $oldUserIds; // Usuarios anteriores
    public $newUserIds; // Usuarios nuevos

    public function __construct(Group $group, array $oldUserIds = [], array $newUserIds = [])
    {
        $this->group = $group->load('users');
        $this->oldUserIds = $oldUserIds;
        $this->newUserIds = $newUserIds;
        $this->userIds = $newUserIds; // Mantener para compatibilidad
    }

    public function broadcastOn()
    {
        $channels = [
            new PrivateChannel('group.updated.' . $this->group->id), // Canal del grupo
        ];

        // Agregar canales de todos los usuarios involucrados (antiguos y nuevos)
        $allUserIds = array_unique(array_merge($this->oldUserIds, $this->newUserIds));
        foreach ($allUserIds as $userId) {
            $channels[] = new PrivateChannel("App.Models.User.{$userId}");
        }

        return $channels;
    }

    public function broadcastAs()
    {
        return 'group.users.updated';
    }
}