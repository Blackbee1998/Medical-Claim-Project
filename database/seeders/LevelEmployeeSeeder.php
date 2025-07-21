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
            ['name'=>'Direktur'],
            ['name'=>'Manager'],
            ['name'=>'Ass Manager'],
            ['name'=>'Sekretaris'],
            ['name'=>'Senior Supervisor'],  
            ['name'=>'Supervisor'],
            ['name'=>'Staff'],
            ['name'=>'Safety'],
            ['name'=>'Danru A'],
            ['name'=>'Danru B'],
            ['name'=>'Danru C'],
            ['name'=>'Danru D'],
            ['name'=>'Security'],
            ['name'=>'Cleaning'],
            ['name'=>'Gardening'],
            ['name'=>'Gondola'],
            ['name'=>'Teknik'],
            ['name'=>'Waiters'],
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
