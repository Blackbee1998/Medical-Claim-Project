<?php

namespace Database\Seeders;

use Schema;
use Carbon\Carbon;
use App\Models\LevelEmployees;
use Illuminate\Database\Seeder;
use Database\Seeders\LevelEmployee;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class LevelEmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        LevelEmployees::truncate();
        Schema::enableForeignKeyConstraints();

        $data = [
            ['name' => 'Staff'],
            ['name' => 'Supervisor'],
        ];

        foreach ($data as $value) {
            LevelEmployees::insert([
                'name' => $value['name'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),

            ]);
        }
    }
}
