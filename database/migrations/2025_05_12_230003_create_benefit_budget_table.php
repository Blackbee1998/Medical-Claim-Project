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
        Schema::create('benefit_budget', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('benefit_type_id');
            $table->unsignedBigInteger('level_employee_id');
            $table->unsignedBigInteger('marriage_status_id')->nullable();
            $table->integer('year');
            $table->decimal('budget', 15, 2);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('benefit_type_id')->references('id')->on('benefit_types');
            $table->foreign('level_employee_id')->references('id')->on('level_employees');
            $table->foreign('marriage_status_id')->references('id')->on('marriage_statuses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('benefit_budget');
    }
};
