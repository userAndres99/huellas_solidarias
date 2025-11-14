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
    public function up()
    {
        Schema::create('donaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organizacion_id')->nullable();
            $table->string('mp_payment_id')->unique();
            $table->decimal('monto', 12, 2)->nullable();
            $table->decimal('comision_marketplace', 12, 2)->nullable();
            $table->string('moneda', 10)->nullable();
            $table->string('email_donante')->nullable();
            $table->string('estado')->nullable();
            $table->timestamp('fecha_disponible')->nullable();
            $table->json('payload_crudo')->nullable();
            $table->timestamps();

            $table->index('organizacion_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('donaciones');
    }
};
