<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('actividad_usuarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id')->index();
            $table->timestamp('ultimo_visto')->nullable()->comment('Última vez que el usuario estuvo activo');
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('actividad_usuarios', function (Blueprint $table) {
            try {
                $table->dropForeign(['usuario_id']);
            } catch (\Throwable $e) {
                // no-op
            }
        });
        Schema::dropIfExists('actividad_usuarios');
    }
};
