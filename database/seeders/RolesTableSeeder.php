<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RolesTableSeeder extends Seeder {
    public function run() {
        $ahora = Carbon::now();
        DB::table('roles')->insert([
            [
                'nombre' => 'Usuario',
                'descripcion' => 'Usuario común que puede publicar casos, comentar y participar en la comunidad.',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
            [
                'nombre' => 'Organización',
                'descripcion' => 'Asociación o grupo verificado que puede crear eventos, gestionar casos y acceder a estadísticas. (ademas de las funciones de Usuario)',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
            [
                'nombre' => 'Admin',
                'descripcion' => 'Administrador con acceso total al sistema, gestión de usuarios y verificación de organizaciones.',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
        ]);
    }
}