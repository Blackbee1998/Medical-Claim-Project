<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\BalanceTransaction;
use App\Models\BenefitClaims;
use App\Models\Employees;
use App\Models\BenefitTypes;
use App\Models\BenefitBudgets;
use App\Models\EmployeeBenefitBalances;
use App\Models\User;

class BalanceTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $year = 2025;
        $employees = Employees::with(['levelEmployees', 'marriageStatuses'])->get();
        $benefitTypes = BenefitTypes::all();
        $users = User::all();
        
        if ($employees->isEmpty() || $benefitTypes->isEmpty()) {
            $this->command->warn('No employees or benefit types found. Please seed employees and benefit types first.');
            return;
        }

        // Create default users if none exist
        if ($users->isEmpty()) {
            $this->command->info('No users found. Creating default users...');
            $defaultUsers = [
                [
                    'name' => 'HR Admin',
                    'username' => 'hradmin',
                    'email' => 'hr@company.com',
                    'password' => bcrypt('password'),
                    'role' => 'admin',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Finance Admin',
                    'username' => 'financeadmin',
                    'email' => 'finance@company.com',
                    'password' => bcrypt('password'),
                    'role' => 'admin',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'System Admin',
                    'username' => 'sysadmin',
                    'email' => 'admin@company.com',
                    'password' => bcrypt('password'),
                    'role' => 'admin',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];
            
            foreach ($defaultUsers as $userData) {
                User::create($userData);
            }
            
            $users = User::all();
        }

        $this->command->info('Creating balance transactions...');

        foreach ($employees as $employee) {
            foreach ($benefitTypes as $benefitType) {
                // Get benefit budget for this employee
                $benefitBudget = BenefitBudgets::where('benefit_type_id', $benefitType->id)
                    ->where('level_employee_id', $employee->level_employee_id)
                    ->where('marriage_status_id', $employee->marriage_status_id)
                    ->where('year', $year)
                    ->first();

                if (!$benefitBudget) {
                    continue;
                }

                // Create or get employee balance record
                $employeeBalance = EmployeeBenefitBalances::firstOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'benefit_budget_id' => $benefitBudget->id,
                    ],
                    [
                        'current_balance' => $benefitBudget->budget,
                    ]
                );

                $currentBalance = $benefitBudget->budget;
                $transactionCount = rand(2, 6); // 2-6 transactions per employee per benefit type

                for ($i = 0; $i < $transactionCount; $i++) {
                    // Randomly choose transaction type (80% debit, 20% credit)
                    $isDebit = rand(1, 100) <= 80;
                    $transactionType = $isDebit ? 'debit' : 'credit';
                    
                    // Generate realistic amounts
                    if ($benefitType->name === 'Medical') {
                        $amount = rand(100000, 1500000); // 100k - 1.5M for medical
                    } else {
                        $amount = rand(200000, 800000); // 200k - 800k for glasses
                    }

                    // For debit transactions, ensure we don't go below 0
                    if ($isDebit && $amount > $currentBalance) {
                        $amount = $currentBalance * 0.5; // Use 50% of remaining balance
                    }

                    $balanceBefore = $currentBalance;
                    
                    if ($isDebit) {
                        $currentBalance -= $amount;
                        $referenceType = 'claim';
                        $description = $this->generateClaimDescription($benefitType->name);
                    } else {
                        $currentBalance += $amount;
                        $referenceType = 'adjustment';
                        $description = 'Manual adjustment: ' . $this->generateAdjustmentReason();
                    }

                    $balanceAfter = $currentBalance;

                    // Create transaction
                    BalanceTransaction::create([
                        'transaction_id' => $this->generateTransactionId(),
                        'employee_id' => $employee->id,
                        'benefit_type_id' => $benefitType->id,
                        'transaction_type' => $transactionType,
                        'amount' => $amount,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $balanceAfter,
                        'reference_type' => $referenceType,
                        'reference_id' => $isDebit ? rand(1, 100) : null,
                        'description' => $description,
                        'processed_by' => $users->random()->id,
                        'year' => $year,
                        'created_at' => now()->subDays(rand(1, 90))->subHours(rand(1, 23)),
                    ]);

                    // Update employee balance
                    $employeeBalance->current_balance = $currentBalance;
                    $employeeBalance->save();

                    // Stop if balance is very low to avoid negative balances
                    if ($currentBalance < 100000) {
                        break;
                    }
                }
            }
        }

        $transactionCount = BalanceTransaction::count();
        $this->command->info("Created {$transactionCount} balance transactions successfully!");
    }

    /**
     * Generate unique transaction ID
     */
    private function generateTransactionId(): string
    {
        do {
            $date = now()->subDays(rand(1, 90))->format('Ymd');
            $number = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            $transactionId = "TXN-{$date}-{$number}";
        } while (BalanceTransaction::where('transaction_id', $transactionId)->exists());

        return $transactionId;
    }

    /**
     * Generate realistic claim descriptions
     */
    private function generateClaimDescription(string $benefitType): string
    {
        if ($benefitType === 'Medical') {
            $descriptions = [
                'Medical checkup at Siloam Hospital',
                'Emergency treatment at RS Pondok Indah',
                'Dental treatment and cleaning',
                'Medicine purchase at Kimia Farma',
                'Laboratory test at Prodia',
                'Specialist consultation - Cardiologist',
                'Physical therapy session',
                'Vaccination program',
                'Health screening package',
                'Outpatient treatment',
            ];
        } else {
            $descriptions = [
                'Prescription glasses purchase',
                'Eye examination at Optical Shop',
                'Contact lenses purchase',
                'Progressive lens upgrade',
                'Anti-radiation glasses',
                'Sunglasses with prescription',
                'Frame replacement',
                'Lens cleaning and adjustment',
                'Blue light filter glasses',
                'Reading glasses purchase',
            ];
        }

        return 'Claim processing: ' . $descriptions[array_rand($descriptions)];
    }

    /**
     * Generate realistic adjustment reasons
     */
    private function generateAdjustmentReason(): string
    {
        $reasons = [
            'Correction for processing error',
            'Refund for cancelled claim',
            'Annual balance top-up',
            'Policy adjustment',
            'System reconciliation',
            'Duplicate payment reversal',
            'Budget reallocation',
            'Bonus allocation from company',
            'Correction for incorrect deduction',
            'Special allowance approval',
        ];

        return $reasons[array_rand($reasons)];
    }
}