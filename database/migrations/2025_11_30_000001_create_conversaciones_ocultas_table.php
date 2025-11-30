<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('conversaciones_ocultas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('otro_user_id');
            $table->timestamps();

            $table->unique(['user_id', 'otro_user_id']);
            $table->index('user_id');
            $table->index('otro_user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('conversaciones_ocultas');
    }
};
