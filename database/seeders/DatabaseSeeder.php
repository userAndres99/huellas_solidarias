<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Support\Carbon;
use App\Models\Conversation;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

      /**   User::factory()->create([
            *'name' => 'Test User',
            *'email' => 'test@example.com',
        *]); */
        // Crea un usuario administrador con datos fijos
        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);
        // Crea otro usuario regular con datos fijos
        User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => bcrypt('password'),
        ]);

        // Crea 10 usuarios adicionales con datos aleatorios
        User::factory(10)->create();

        /*
        |-----------------------------------------------------------
        |  Creacion de grupos y asignación de usuarios
        |-----------------------------------------------------------
        */

        for($i=0; $i < 5; $i++){
            // Crea un grupo y asigna como propietario al usuario con ID = 1 (John Doe)
            $group = Group::factory()->create([
                'owner_id' => 1,
            ]);

            // Obtiene un conjunto aleatorio de entre 2 y 5 usuarios
            
            $users = User::inRandomOrder()->limit(rand(2,5))->pluck('id');
            // Asocia al grupo el usuario 1 (admin) y los usuarios seleccionados aleatoriamente
            $group->users()->attach(array_unique([1, ...$users]));
        }

        /*
        |----------------------------------------------------------------------
        |   CREACIÓN DE MENSAJES
        |----------------------------------------------------------------------
        */
        // Genera 100 mensajes aleatorios (tanto privados como grupos)
        Message::factory(100)->create();
        // Obtiene todos los mensajes que NO pertenecen a un grupo
        // (es decir, mensajes privados entre usuarios)
        $message = Message::whereNull('group_id')->orderBy('created_at')->get();

        // Agrupa los mensajes por conversación entre usuarios
        //Ejemplo: 1->2 y 2 -> 1 quedan justo bajo la clave 1_"
        $conversations = $message->groupBy(function($message){
            //Crea un identificador único  ordenando los IDs de los usuarios
            return collect([$message->sender_id, $message->receiver_id])->sort()->implode('_');
        })->map(function($groupedMessages){
            // Por cada grupo de mensajes, crea una "conversacion" con los siguientes datos:
            return [
                'user_id1' => $groupedMessages->first()->sender_id,
                'user_id2' => $groupedMessages->first()->receiver_id,
                'last_message_id' => $groupedMessages->last()->id, // el ultimo mensaje del chat
                'created_at' => new Carbon(),
                'updated_at' => new Carbon(), 
            ];
        })->values(); // limpia las claves ("1_2", etc.) dejando un array limpio


        /*
        |--------------------------------------------------------------
        |   INSERCIÓN FINAL EN LA TABLA CONVERSATIONS
        |--------------------------------------------------------------
        */
        // Inserta toda las conversaciones generadas
        // Si alguna ya existe (por clave única), la ignora.
        Conversation::insertOrIgnore($conversations->toArray());
    }
}
