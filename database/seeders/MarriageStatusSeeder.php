<?php

namespace Database\Seeders;

use App\Models\MarriageStatuses;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class MarriageStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        MarriageStatuses::truncate();
        Schema::enableForeignKeyConstraints();

        $data = [
            ['code' => 'TK', 'description' => 'Belum Menikah'],
            ['code' => 'K0', 'description' => 'Menikah Belum Punya Anak'],
            ['code' => 'K1', 'description' => 'Menikah Punya Anak 1'],
            ['code' => 'K2', 'description' => 'Menikah Punya Anak 2'],
            ['code' => 'K3', 'description' => 'Menikah Punya Anak 3'],
        ];

        foreach ($data as $value) {
            MarriageStatuses::insert([
                'code' => $value['code'],
                'description' => $value['description'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),

            ]);
        }
    }
}
