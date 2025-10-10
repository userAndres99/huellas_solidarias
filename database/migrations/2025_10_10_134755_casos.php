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
        //
       Schema::create('casos', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('idUsuario');
    $table->string('fotoAnimal')->nullable();
    $table->string('tipoAnimal')->nullable();
    $table->text('descripcion')->nullable();
    $table->string('situacion')->nullable();
    $table->string('ciudad')->nullable();
    $table->decimal('latitud', 10, 7)->nullable();
    $table->decimal('longitud', 10, 7)->nullable();
    $table->string('telefonoContacto', 20)->nullable();
    $table->dateTime('fechaPublicacion')->default(now());
    $table->enum('estado', ['activo', 'cerrado', 'resuelto'])->default('activo');
    $table->timestamps();

    $table->foreign('idUsuario')->references('id')->on('users')->onDelete('cascade');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
