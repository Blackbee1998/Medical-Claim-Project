<?php

namespace Database\Seeders;

use App\Models\BenefitTypes;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class BenefitTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        BenefitTypes::truncate();
        Schema::enableForeignKeyConstraints();

        $data = [
            ['name' => 'medical'],
            ['name' => 'glasses'],
        ];

        foreach ($data as $value) {
            BenefitTypes::insert([
                'name' => $value['name'],
                'created_at' => now(),
                'updated_at' => now(),
                'deleted_at' => null,
            ]);
        }
    }
}
