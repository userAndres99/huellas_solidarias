<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMpCuentasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('mp_cuentas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('organizacion_id')->nullable();
            $table->string('mp_user_id')->nullable()->index();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->string('token_type')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('scopes')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('organizacion_id');
            $table->unique(['organizacion_id'], 'mp_cuentas_organizacion_unique');

            // Agregar clave foránea a organizaciones.id
            try {
                $table->foreign('organizacion_id')->references('id')->on('organizaciones')->onDelete('cascade');
            } catch (\Throwable $e) {
                // Si la tabla referenciada o las restricciones no existen aún, omitir agregar la clave foránea.
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('mp_cuentas');
    }
}
