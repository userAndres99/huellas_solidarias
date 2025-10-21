<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // string con valor por defecto para no romper usuarios 
            $table->string('role')->default('Usuario')->after('email');
        });

        //por si hay usuarios existentes sin role
        \DB::table('users')->whereNull('role')->update(['role' => 'Usuario']);
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
}