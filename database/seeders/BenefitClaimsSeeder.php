<?php

namespace Database\Seeders;

use Carbon\Carbon;
use App\Models\Employees;
use App\Models\BenefitTypes;
use App\Models\BenefitClaims;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BenefitClaimsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        BenefitClaims::truncate();
        Schema::enableForeignKeyConstraints();

        $employees = Employees::all();
        $benefitTypes = BenefitTypes::all();
        
        if ($employees->isEmpty() || $benefitTypes->isEmpty()) {
            $this->command->info('No employees or benefit types found. Please run EmployeeSeeder and BenefitTypeSeeder first.');
            return;
        }

        // Check if users exist and create a default admin user if needed
        $adminUserId = $this->ensureAdminUserExists();

        $claims = [];
        $claimNumber = 1;
        $currentYear = date('Y');
        
        // Generate claims for the current year and previous year
        for ($year = $currentYear - 1; $year <= $currentYear; $year++) {
            foreach ($employees as $employee) {
                // Each employee makes 2-8 claims per year randomly
                $claimsCount = rand(2, 8);
                
                for ($i = 0; $i < $claimsCount; $i++) {
                    $benefitType = $benefitTypes->random();
                    
                    // Generate random claim date within the year
                    $startDate = Carbon::create($year, 1, 1);
                    $endDate = $year === $currentYear ? now() : Carbon::create($year, 12, 31);
                    $claimDate = $startDate->addDays(rand(0, $startDate->diffInDays($endDate)));
                    
                    // Generate amount based on benefit type
                    $amount = $this->generateClaimAmount($benefitType->name);
                    
                    // Generate status (mostly approved for reporting purposes)
                    $status = $this->generateClaimStatus();
                    
                    $claimData = [
                        'employee_id' => $employee->id,
                        'benefit_type_id' => $benefitType->id,
                        'amount' => $amount,
                        'claim_number' => "CLM-{$year}-" . str_pad($claimNumber, 6, '0', STR_PAD_LEFT),
                        'description' => $this->generateClaimDescription($benefitType->name),
                        'claim_date' => $claimDate->toDateString(),
                        'status' => $status,
                        'notes' => $status === 'approved' ? null : $this->generateClaimNotes($status),
                        'receipt_file' => null,
                        'created_at' => $claimDate->toDateTimeString(),
                        'updated_at' => $claimDate->addDays(rand(1, 7))->toDateTimeString(),
                        'deleted_at' => null,
                    ];

                    // Add created_by only if admin user exists and column exists
                    if ($adminUserId && Schema::hasColumn('benefit_claims', 'created_by')) {
                        $claimData['created_by'] = $adminUserId;
                    }

                    $claims[] = $claimData;
                    $claimNumber++;
                }
            }
        }
        
        // Insert claims in batches
        $chunks = array_chunk($claims, 100);
        foreach ($chunks as $chunk) {
            BenefitClaims::insert($chunk);
        }
        
        $this->command->info('Generated ' . count($claims) . ' benefit claims for reporting.');
    }
    
    /**
     * Generate claim amount based on benefit type
     */
    private function generateClaimAmount(string $benefitTypeName): float
    {
        switch (strtolower($benefitTypeName)) {
            case 'medical':
                // Medical claims: 100,000 - 2,000,000
                return rand(100000, 2000000);
            case 'glasses':
                // Glasses claims: 200,000 - 800,000
                return rand(200000, 800000);
            case 'dental':
                // Dental claims: 150,000 - 1,000,000
                return rand(150000, 1000000);
            default:
                // Other benefits: 50,000 - 500,000
                return rand(50000, 500000);
        }
    }
    
    /**
     * Generate claim status (weighted towards approved)
     */
    private function generateClaimStatus(): string
    {
        $rand = rand(1, 100);
        
        if ($rand <= 75) {
            return 'approved';
        } elseif ($rand <= 85) {
            return 'pending';
        } elseif ($rand <= 95) {
            return 'processing';
        } else {
            return 'rejected';
        }
    }
    
    /**
     * Generate claim description based on benefit type
     */
    private function generateClaimDescription(string $benefitTypeName): string
    {
        $descriptions = [
            'medical' => [
                'Hospital consultation and medication',
                'Emergency room treatment',
                'Specialist doctor consultation',
                'Medical check-up and lab tests',
                'Physical therapy session',
                'Surgery and hospitalization',
                'Prescription medication',
                'Diagnostic imaging (X-ray, CT scan)',
            ],
            'glasses' => [
                'Eye examination and new glasses',
                'Contact lenses purchase',
                'Progressive lens upgrade',
                'Sunglasses with prescription',
                'Frame replacement',
                'Lens coating and treatment',
                'Reading glasses',
                'Computer glasses for eye protection',
            ],
            'dental' => [
                'Dental cleaning and check-up',
                'Tooth filling and restoration',
                'Root canal treatment',
                'Dental crown installation',
                'Teeth whitening treatment',
                'Orthodontic consultation',
                'Wisdom tooth extraction',
                'Gum disease treatment',
            ],
        ];
        
        $typeKey = strtolower($benefitTypeName);
        $typeDescriptions = $descriptions[$typeKey] ?? ['General benefit claim'];
        
        return $typeDescriptions[array_rand($typeDescriptions)];
    }
    
    /**
     * Generate claim notes for non-approved claims
     */
    private function generateClaimNotes(string $status): string
    {
        switch ($status) {
            case 'pending':
                return 'Waiting for documentation review';
            case 'processing':
                return 'Under review by benefits team';
            case 'rejected':
                $reasons = [
                    'Insufficient documentation provided',
                    'Claim exceeds annual limit',
                    'Service not covered under policy',
                    'Duplicate claim submission',
                ];
                return $reasons[array_rand($reasons)];
            default:
                return '';
        }
    }

    /**
     * Ensure admin user exists for seeding purposes
     */
    private function ensureAdminUserExists(): ?int
    {
        // Check if users table exists
        if (!Schema::hasTable('users')) {
            $this->command->warn('Users table does not exist. Claims will be created without created_by.');
            return null;
        }

        // Check if any user exists
        $existingUser = DB::table('users')->first();
        if ($existingUser) {
            return $existingUser->id;
        }

        // Create a default admin user for seeding
        try {
            $userId = DB::table('users')->insertGetId([
                'name' => 'System Admin',
                'email' => 'admin@system.local',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info('Created default admin user for seeding (ID: ' . $userId . ')');
            return $userId;
        } catch (\Exception $e) {
            $this->command->warn('Could not create admin user: ' . $e->getMessage());
            return null;
        }
    }
} 