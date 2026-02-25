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
        Schema::create('mod_users', function (Blueprint $table) {
            $table->id();
            $table->uuid('mod_id');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['admin', 'editor', 'viewer'])->default('viewer');
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->foreign('mod_id')->references('id')->on('mods')->onDelete('cascade');
            $table->unique(['mod_id', 'user_id']);
            $table->index('mod_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mod_users');
    }
};
