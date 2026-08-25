<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mods', function (Blueprint $table) {
            $table->string('domain_status')->default('pending_dns')->after('domain_verified');
            $table->timestamp('domain_checked_at')->nullable()->after('domain_verification_token');
            $table->timestamp('domain_ready_at')->nullable()->after('domain_checked_at');
        });
    }

    public function down(): void
    {
        Schema::table('mods', function (Blueprint $table) {
            $table->dropColumn(['domain_status', 'domain_checked_at', 'domain_ready_at']);
        });
    }
};
