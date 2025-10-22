<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSolicitudVerificacionTable extends Migration
{
    public function up()
    {
        Schema::create('solicitud_verificacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('organization_name')->nullable(); // opcional: si el usuario nombra la org
            $table->string('organization_phone')->nullable(); // teléfono de la organización
            $table->string('organization_email')->nullable(); // correo de la organización

            $table->text('message')->nullable(); // mensaje adicional del usuario
            $table->json('documents')->nullable(); // array con rutas a documentos subidos

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            // reviewer: (admin que reviso), nullable
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('response_message')->nullable(); // mensaje del admin (rechazo/aprobacion)
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('solicitud_verificacion');
    }
}