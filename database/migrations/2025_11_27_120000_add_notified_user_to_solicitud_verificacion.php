<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNotifiedUserToSolicitudVerificacion extends Migration
{
    public function up()
    {
        Schema::table('solicitud_verificacion', function (Blueprint $table) {
            $table->boolean('notified_user')->default(false)->after('response_message');
        });
    }

    public function down()
    {
        Schema::table('solicitud_verificacion', function (Blueprint $table) {
            $table->dropColumn('notified_user');
        });
    }
}
