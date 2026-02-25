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
        Schema::create('files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mod_id');
            $table->uuid('page_id')->nullable();
            $table->string('original_name');
            $table->string('filename');
            $table->string('path');
            $table->string('mime_type');
            $table->bigInteger('size');
            $table->enum('storage_driver', ['local', 's3']);
            $table->string('url')->nullable();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('mod_id')->references('id')->on('mods')->onDelete('cascade');
            $table->foreign('page_id')->references('id')->on('pages')->onDelete('set null');

            $table->index('mod_id');
            $table->index('page_id');
            $table->index('filename');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
