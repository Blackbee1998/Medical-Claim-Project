<?php

namespace Database\Seeders;

use Carbon\Carbon;
use App\Models\Employees;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        Employees::truncate();
        Schema::enableForeignKeyConstraints();

        $data = [
            ['level_employee_id' => '2', 'marriage_status_id,' => '3', 'nik' => '0340041', 'name' => 'HERDI SUNDJAJA', 'department' => 'ACC & FIN', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '2', 'nik' => '1640785', 'name' => 'DANISH ARTHA SUBRATA', 'department' => 'ADMINISTRASI & GENERAL', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '1', 'nik' => '2340860', 'name' => 'ERRIN TARUNA', 'department' => 'ACC & FIN', 'gender' => 'female'],
            ['level_employee_id' => '2', 'marriage_status_id,' => '1', 'nik' => '1440744', 'name' => 'FRANSISCA IRAWATY', 'department' => 'PURCHASING', 'gender' => 'female'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '1', 'nik' => '1540763', 'name' => 'FELYA GABI MEGAN', 'department' => 'PURCHASING', 'gender' => 'female'],
            ['level_employee_id' => '2', 'marriage_status_id,' => '4', 'nik' => '9540032', 'name' => 'DADANG SANUSI', 'department' => 'BRD & HKG', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '3', 'nik' => '1940832', 'name' => 'CANDRA IRAWAN', 'department' => 'BRD & HKG', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '1', 'nik' => '1440729', 'name' => 'SINTIA DANIA PUTRI', 'department' => 'BRD & HKG', 'gender' => 'female'],
            ['level_employee_id' => '2', 'marriage_status_id,' => '4', 'nik' => '0840369', 'name' => 'FAIJAR DWI NURYANTO', 'department' => 'F&B', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '4', 'nik' => '9040153', 'name' => 'MARDIYONO', 'department' => 'F & B', 'gender' => 'male'],
            ['level_employee_id' => '2', 'marriage_status_id,' => '3', 'nik' => '1540750', 'name' => 'ABDUL MALIK', 'department' => 'Security', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '1', 'nik' => '1540750', 'name' => 'AHMAD ZAINI', 'department' => 'Security', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '4', 'nik' => '0040045', 'name' => 'AGUS DJULI DJUNAEDI', 'department' => 'Security', 'gender' => 'male'],
            ['level_employee_id' => '2', 'marriage_status_id,' => '3', 'nik' => '1440733', 'name' => 'ANTHONY', 'department' => 'TEKNIK', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '3', 'nik' => '2340861', 'name' => 'WAHYUDI', 'department' => 'TEKNIK', 'gender' => 'male'],
            ['level_employee_id' => '1', 'marriage_status_id,' => '3', 'nik' => '9640134', 'name' => 'OMAN SUGANDA', 'department' => 'TEKNIK', 'gender' => 'male'],
            //['level_employee_id' => '', 'marriage_status_id,' => '', 'nik' => '', 'name' => '', 'department' => '', 'gender' => '']
        ];

        foreach ($data as $value) {
            Employees::insert([
                'level_employee_id' => $value['level_employee_id'],
                'marriage_status_id' => $value['marriage_status_id,'],
                'nik' => $value['nik'],
                'name' => $value['name'],
                'department' => $value['department'],
                'gender' => $value['gender'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),

            ]);
        }
    }
}