<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('casos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('idUsuario')->constrained('users')->onDelete('cascade');
            $table->string('fotoAnimal')->nullable();
            $table->string('tipoAnimal')->nullable();
            $table->text('descripcion');
            $table->string('situacion')->nullable();
            $table->enum('sexo', ['Macho', 'Hembra'])->nullable();
            $table->enum('tamano', ['Chico', 'Mediano', 'Grande'])->nullable();
            $table->string('ciudad')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->string('telefonoContacto', 30)->nullable();
            $table->dateTime('fechaPublicacion')->default(now());
            $table->enum('estado', ['activo', 'cancelado', 'finalizado'])->default('activo');
            $table->timestamps();

            $table->index('estado');
            $table->index('fechaPublicacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('casos', function (Blueprint $table) {
            $table->dropIndex(['estado']);
            $table->dropIndex(['fechaPublicacion']);
            $table->dropForeign(['idUsuario']);
        });

        Schema::dropIfExists('casos');
    }
};