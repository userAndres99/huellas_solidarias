<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividad_conversaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id')->index();
            $table->string('clave')->index()->comment("Clave de conversacion: 'u_{userId}' o 'g_{groupId}'");
            $table->timestamp('ultimo_visto')->nullable();
            $table->timestamps();

            $table->unique(['usuario_id', 'clave']);
            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('actividad_conversaciones', function (Blueprint $table) {
            try { $table->dropForeign(['usuario_id']); } catch (\Throwable $_) {}
        });
        Schema::dropIfExists('actividad_conversaciones');
    }
};
