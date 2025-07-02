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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('level_employee_id');
            $table->unsignedBigInteger('marriage_status_id');
            $table->string('nik', 20);
            $table->string('name', 255);
            $table->string('department', 255);
            $table->enum('gender', ['male', 'female']);
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('level_employee_id')->references('id')->on('level_employees');
            $table->foreign('marriage_status_id')->references('id')->on('marriage_statuses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
