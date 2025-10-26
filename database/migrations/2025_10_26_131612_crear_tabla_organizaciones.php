<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('organizaciones', function (Blueprint $table) {
            $table->id();

            // Usuario que creo la organizacion (solicitante verificado)
            $table->foreignId('usuario_creador_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Datos basicos
            $table->string('nombre');
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->text('descripcion')->nullable();

            // Ubicación geografica (vamos a usar un mapa dinamico para marcar ubicaciones)
            $table->decimal('latitud', 10, 7)->nullable();  
            $table->decimal('longitud', 10, 7)->nullable(); 

            // Documentacion (archivos JSON o URLs a documentos subidos)
            $table->json('documentacion')->nullable();

            // Fecha de verificaciOn (cuando el admin aprueba)
            $table->timestamp('verificado_en')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('organizaciones');
    }
};