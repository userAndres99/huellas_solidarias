<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Model>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {

        $senderId = $this->faker->randomElement([0, 1]);
        if($senderId === 0){
            // Si salió 0: elegimos un sender aleatorio distinto  de 1, y el receiver será 1
            $senderId = $this->faker->randomElement(\App\Models\User::where('id', '!=', 1)->pluck('id')->toArray());
            $receiverId = 1;
        }else{
            // Si salió 1: dejamos senderId = 1 y elegimos aleatorio entre todos los users
            $receiverId = $this->faker->randomElement(\App\Models\User::pluck('id')->toArray());
        }

        $groupId = null;
        if ($this->faker->boolean(50)){
            // en 50% de los casos convertimos el mensaje en mensaje de grupo
            $groupId = $this->faker->randomElement(\App\Models\Group::pluck('id')->toArray());
            $group = \App\Models\Group::find($groupId);
            // Para mensajes de grupo del sender es un miembro del grupo y receiver = null
            $senderId = $this->faker->randomElement($group->users->pluck('id')->toArray());
            $receiverId = null;
        }







        return [
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'group_id' => $groupId,
            'message' => $this->faker->realText(200),
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
