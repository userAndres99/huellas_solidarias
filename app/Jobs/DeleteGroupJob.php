<?php

namespace App\Jobs;

use App\Models\Group;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Events\GroupDeleted;

class DeleteGroupJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Group $group)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $id = $this->group->id;
        $name =  $this->group->name;

        // recolectar los ids de usuarios antes de quitar relaciones
        $userIds = $this->group->users->pluck('id')->toArray();

        $this->group->last_message_id = null;
        $this->group->save();

        // Iterar sobre todos los mensajes y borrarlos
        $this->group->messages->each->delete();

        //Remover todos los usuarios del grupo
        $this->group->users()->detach();

        //  borrar el grupo

        $this->group->delete();


        GroupDeleted::dispatch($id, $name, $userIds);
    }
}
