<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@company.com',
                'password' => Hash::make('admin123'),
                'is_active' => 1,
                'role' => 'admin',
            ],
            [
                'name' => 'John Smith',
                'username' => 'john.smith',
                'email' => 'john.smith@company.com',
                'password' => Hash::make('password123'),
                'is_active' => 1,
                'role' => 'staff',
            ],
            [
                'name' => 'Jane Doe',
                'username' => 'jane.doe',
                'email' => 'jane.doe@company.com',
                'password' => Hash::make('password123'),
                'is_active' => 1,
                'role' => 'staff',
            ],
            [
                'name' => 'Michael Johnson',
                'username' => 'michael.johnson',
                'email' => 'michael.johnson@company.com',
                'password' => Hash::make('password123'),
                'is_active' => 1,
                'role' => 'staff',
            ],
            [
                'name' => 'Sarah Williams',
                'username' => 'sarah.williams',
                'email' => 'sarah.williams@company.com',
                'password' => Hash::make('password123'),
                'is_active' => 0,
                'role' => 'staff',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['username' => $userData['username']], // Find by username
                $userData // Update or create with this data
            );
        }
    }
}