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
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mod_id');
            $table->uuid('parent_id')->nullable();
            $table->string('title');
            $table->string('slug');
            $table->text('content')->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_index')->default(false);
            $table->boolean('published')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('mod_id')->references('id')->on('mods')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('pages')->onDelete('cascade');

            $table->index('mod_id');
            $table->index('parent_id');
            $table->index('slug');
            $table->index('published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
