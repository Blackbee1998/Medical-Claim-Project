<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('access_tokens')) {
            Schema::create('access_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->text('token');
                $table->text('refresh_token');
                $table->timestamp('expires_at');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('revoked_at')->nullable();

                $table->foreign('user_id')->references('id')->on('users');
            });
            
            // Indeks dibuat setelah tabel dibuat
            DB::statement('ALTER TABLE access_tokens ADD INDEX access_tokens_token_index (token(191))');
            DB::statement('ALTER TABLE access_tokens ADD INDEX access_tokens_refresh_token_index (refresh_token(191))');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_tokens');
    }
};
