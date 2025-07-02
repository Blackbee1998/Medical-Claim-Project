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
        Schema::create('balance_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('benefit_type_id')->constrained('benefit_types')->onDelete('cascade');
            $table->enum('transaction_type', ['debit', 'credit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->enum('reference_type', ['claim', 'adjustment']);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable(); // User ID who processed the transaction
            $table->integer('year');
            $table->timestamps();
            
            // Indexes for better query performance
            $table->index(['employee_id', 'benefit_type_id']);
            $table->index(['transaction_type']);
            $table->index(['reference_type', 'reference_id']);
            $table->index(['processed_by']);
            $table->index(['year']);
            $table->index(['created_at']);
            
            // Foreign key for processed_by (user who processed the transaction)
            $table->foreign('processed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('balance_transactions');
    }
};