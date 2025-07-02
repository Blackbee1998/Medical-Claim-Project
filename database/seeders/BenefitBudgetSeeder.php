<?php

namespace Database\Seeders;

use App\Models\BenefitBudgets;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class BenefitBudgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        BenefitBudgets::truncate();
        Schema::enableForeignKeyConstraints();

        $data = [
            ['benefit_type_id' => 1, 'level_employee_id' => 1, 'marriage_status_id' => 1, 'year' => 2025, 'budget' => 900000],
            ['benefit_type_id' => 1, 'level_employee_id' => 1, 'marriage_status_id' => 2, 'year' => 2025, 'budget' => 1000000],
            ['benefit_type_id' => 1, 'level_employee_id' => 1, 'marriage_status_id' => 3, 'year' => 2025, 'budget' => 1125000],
            ['benefit_type_id' => 1, 'level_employee_id' => 1, 'marriage_status_id' => 4, 'year' => 2025, 'budget' => 1250000],
            ['benefit_type_id' => 1, 'level_employee_id' => 1, 'marriage_status_id' => 5, 'year' => 2025, 'budget' => 1500000],
            ['benefit_type_id' => 1, 'level_employee_id' => 1, 'marriage_status_id' => null, 'year' => 2025, 'budget' => 900000],
            ['benefit_type_id' => 1, 'level_employee_id' => 2, 'marriage_status_id' => null, 'year' => 2025, 'budget' => 3000000],
        ];

        foreach ($data as $value) {
            BenefitBudgets::insert([
                'benefit_type_id' => $value['benefit_type_id'],
                'level_employee_id' => $value['level_employee_id'],
                'marriage_status_id' => $value['marriage_status_id'],
                'year' => $value['year'],
                'budget' => $value['budget'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
