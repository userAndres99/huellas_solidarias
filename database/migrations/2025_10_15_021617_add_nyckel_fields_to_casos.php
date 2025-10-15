<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


class AddNyckelFieldsToCasos extends Migration
{
    public function up()
    {
        Schema::table('casos', function (Blueprint $table) {
            $table->string('nyckel_sample_id')->nullable()->after('fotoAnimal');
        });
    }


    public function down()
    {
        Schema::table('casos', function (Blueprint $table) {
            $table->dropColumn('nyckel_sample_id');
        });
    }
}