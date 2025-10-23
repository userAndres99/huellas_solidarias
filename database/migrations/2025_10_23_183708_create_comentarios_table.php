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
        Schema::create('comentarios', function (Blueprint $table) {
            $table->id();
            //Relación polimórfica
            $table->morphs('comentable'); // genera 'comentable_id' y 'comentable_type'

            // Usuario
            $table -> foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table -> string('usuario_nombre')->nullable();
            $table -> string('usuario_avatar')->nullable();

            // contenido
            $table ->text('texto');

            //Respuesta anidada
            $table -> foreignId('parent_id')->nullable()->constrained('comentarios')->onDelete('cascade');  

            // Likes
            $table ->unsignedInteger('likes')->default(0);

            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comentarios');
    }
};
