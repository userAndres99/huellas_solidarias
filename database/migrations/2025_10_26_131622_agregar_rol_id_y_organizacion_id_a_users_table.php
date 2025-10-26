<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            // Si ya tienes columna string 'role' migra sus valores antes de borrarla.
            $table->foreignId('rol_id')->nullable()->after('id')->constrained('roles')->nullOnDelete();
            $table->foreignId('organizacion_id')->nullable()->after('rol_id')->constrained('organizaciones')->nullOnDelete();
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['rol_id']);
            $table->dropColumn('rol_id');
            $table->dropForeign(['organizacion_id']);
            $table->dropColumn('organizacion_id');
        });
    }
};