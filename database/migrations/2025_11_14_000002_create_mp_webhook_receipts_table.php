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
        Schema::create('mp_webhook_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('topic')->nullable();
            $table->string('resource')->nullable();
            $table->string('resource_id')->nullable();
            $table->string('payload_hash')->unique();
            $table->json('raw_payload')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->boolean('processed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('mp_webhook_receipts');
    }
};
