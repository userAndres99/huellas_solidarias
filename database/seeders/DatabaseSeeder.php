<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Database\Seeders\RolesTableSeeder;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar el seeder de roles (Usuariom, Organización, Admin)
        $this->call(RolesTableSeeder::class);

        // Seed inicial de usuarios mínimos 
        $this->call(UsersTableSeeder::class);

        // Seed de conversaciones y mensajes de ejemplo 
        $this->call(ConversationsSeeder::class);
    }
}
