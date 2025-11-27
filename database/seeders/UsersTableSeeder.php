<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $users = [
            ['name' => 'María González', 'email' => 'maria.gonzalez@example.com'],
            ['name' => 'Carlos Fernández', 'email' => 'carlos.fernandez@example.com'],
            ['name' => 'Lucía Rodríguez', 'email' => 'lucia.rodriguez@example.com'],
            ['name' => 'Javier Martínez', 'email' => 'javier.martinez@example.com'],
            ['name' => 'Ana López', 'email' => 'ana.lopez@example.com'],
            ['name' => 'Administrador', 'email' => 'administrador@example.com'],
        ];

        foreach ($users as $u) {
            // Decide rol_id: administrador@example.com -> 3 
            $rolId = ($u['email'] === 'administrador@example.com') ? 3 : 1;

            // incertar o actualizar usuario
            DB::table('users')->updateOrInsert(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'password' => Hash::make('password'), // contraseña por defecto
                    'rol_id' => $rolId,
                    'email_verified_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
