<?php

namespace App\Http\Controllers;

use App\Events\GroupUserUpdated;
use App\Models\Group;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Jobs\DeleteGroupJob;

class GroupController extends Controller
{
   

   

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGroupRequest $request)
{
    $data = $request->validated();
    $user_ids = $data['user_ids'] ?? [];
    $group = Group::create($data);
    $group->users()->attach(array_unique([$request->user()->id, ...$user_ids]));

    // Recargar relación users
    $group->load('users');

    // Disparar evento
    \App\Events\GroupCreated::dispatch($group);

    return redirect()->back();
}

    

    
    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGroupRequest $request, Group $group)
{
    $data = $request->validated();
    $user_ids = $data['user_ids'] ?? [];

    // Obtener IDs de usuarios actuales antes de actualizar
    $oldUserIds = $group->users->pluck('id')->toArray();

    $group->update($data);

    $group->users()->detach();
    $group->users()->attach(array_unique([$request->user()->id, ...$user_ids]));

    // Recargar relación users
    $group->load('users');

    // Obtener IDs de usuarios nuevos
    $newUserIds = $group->users->pluck('id')->toArray();

    // Disparar evento con usuarios antiguos y nuevos
    event(new GroupUserUpdated($group, $oldUserIds, $newUserIds));

    return redirect()->back();
}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group)
    {
        //

        if ($group->owner_id !== auth()->id())
        {
            abort(403);
        }

        DeleteGroupJob::dispatch($group)->delay(now()->addSeconds(20));

        return response()->json(['message' => 'La eliminación del grupo estaba programada y se eliminará pronto']);
    }
}
