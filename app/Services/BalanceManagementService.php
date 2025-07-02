<?php

namespace App\Services;

use Exception;
use App\Models\User;
use App\Models\Employees;
use App\Models\BenefitTypes;
use App\Models\BenefitBudgets;
use App\Models\BenefitClaims;
use App\Models\BalanceTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\EmployeeBenefitBalances;
use Illuminate\Support\Facades\Cache;

class BalanceManagementService
{
    /**
     * Get employee balance summary for a specific year
     *
     * @param int $employeeId
     * @param int $year
     * @return array
     */
    public function getEmployeeBalanceSummary(int $employeeId, int $year): array
    {
        $employee = Employees::with(['levelEmployees', 'marriageStatuses'])->find($employeeId);
        
        if (!$employee) {
            throw new Exception('Employee not found');
        }

        // Get all benefit budgets for this employee based on their level and marriage status
        // Apply business rules: Supervisors (level_employee_id = 2) get budget with marriage_status_id = null
        $benefitBudgets = BenefitBudgets::with('benefitType')
            ->where('year', $year)
            ->where('level_employee_id', $employee->level_employee_id)
            ->where(function($query) use ($employee) {
                if ($employee->level_employee_id == 2) {
                    // Supervisor: use budget with null marriage_status_id
                    $query->whereNull('marriage_status_id');
                } else {
                    // Staff and others: use budget matching their marriage_status_id
                    $query->where('marriage_status_id', $employee->marriage_status_id);
                }
            })
            ->get();

        $balances = [];
        $totalInitialBalance = 0;
        $totalUsedAmount = 0;
        $totalCurrentBalance = 0;

        foreach ($benefitBudgets as $budget) {
            // Get current balance from employee_benefit_balances table
            $employeeBalance = EmployeeBenefitBalances::where('employee_id', $employeeId)
                ->where('benefit_budget_id', $budget->id)
                ->first();

            $currentBalance = $employeeBalance ? $employeeBalance->current_balance : $budget->budget;
            $usedAmount = $budget->budget - $currentBalance;
            $usagePercentage = $budget->budget > 0 ? ($usedAmount / $budget->budget) * 100 : 0;

            // Get last claim date and total claims count
            $lastClaim = BenefitClaims::where('employee_id', $employeeId)
                ->where('benefit_type_id', $budget->benefit_type_id)
                ->whereYear('claim_date', $year)
                ->where('status', 'approved')
                ->latest('claim_date')
                ->first();

            $totalClaims = BenefitClaims::where('employee_id', $employeeId)
                ->where('benefit_type_id', $budget->benefit_type_id)
                ->whereYear('claim_date', $year)
                ->where('status', 'approved')
                ->count();

            $balances[] = [
                'benefit_type' => [
                    'id' => $budget->benefitType->id,
                    'name' => $budget->benefitType->name,
                ],
                'initial_balance' => (float) $budget->budget,
                'used_amount' => (float) $usedAmount,
                'current_balance' => (float) $currentBalance,
                'usage_percentage' => round($usagePercentage, 2),
                'last_claim_date' => $lastClaim ? $lastClaim->claim_date->format('Y-m-d') : null,
                'total_claims' => $totalClaims,
            ];

            $totalInitialBalance += $budget->budget;
            $totalUsedAmount += $usedAmount;
            $totalCurrentBalance += $currentBalance;
        }

        $overallUsagePercentage = $totalInitialBalance > 0 ? ($totalUsedAmount / $totalInitialBalance) * 100 : 0;

        return [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'nik' => $employee->nik,
                'department' => $employee->department,
            ],
            'year' => $year,
            'balances' => $balances,
            'summary' => [
                'total_initial_balance' => (float) $totalInitialBalance,
                'total_used_amount' => (float) $totalUsedAmount,
                'total_current_balance' => (float) $totalCurrentBalance,
                'overall_usage_percentage' => round($overallUsagePercentage, 2),
            ],
        ];
    }

    /**
     * Check if employee has sufficient balance for a claim
     *
     * @param int $employeeId
     * @param int $benefitTypeId
     * @param float $amount
     * @param int $year
     * @return array
     */
    public function checkAvailableBalance(int $employeeId, int $benefitTypeId, float $amount, int $year): array
    {
        $employee = Employees::find($employeeId);
        $benefitType = BenefitTypes::find($benefitTypeId);
        
        if (!$employee) {
            throw new Exception('Employee not found');
        }
        
        if (!$benefitType) {
            throw new Exception('Benefit type not found');
        }

        // Get benefit budget for this employee
        // Apply business rules: Supervisors (level_employee_id = 2) get budget with marriage_status_id = null
        $benefitBudget = BenefitBudgets::where('benefit_type_id', $benefitTypeId)
            ->where('level_employee_id', $employee->level_employee_id)
            ->where('year', $year)
            ->where(function($query) use ($employee) {
                if ($employee->level_employee_id == 2) {
                    // Supervisor: use budget with null marriage_status_id
                    $query->whereNull('marriage_status_id');
                } else {
                    // Staff and others: use budget matching their marriage_status_id
                    $query->where('marriage_status_id', $employee->marriage_status_id);
                }
            })
            ->first();

        if (!$benefitBudget) {
            throw new Exception('No benefit budget found for this employee and benefit type');
        }

        // Get current balance
        $employeeBalance = EmployeeBenefitBalances::where('employee_id', $employeeId)
            ->where('benefit_budget_id', $benefitBudget->id)
            ->first();

        $currentBalance = $employeeBalance ? $employeeBalance->current_balance : $benefitBudget->budget;
        $sufficientBalance = $currentBalance >= $amount;

        $result = [
            'sufficient_balance' => $sufficientBalance,
            'current_balance' => (float) $currentBalance,
            'requested_amount' => (float) $amount,
            'benefit_type' => $benefitType->name,
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'nik' => $employee->nik,
            ],
        ];

        if ($sufficientBalance) {
            $result['remaining_after_claim'] = (float) ($currentBalance - $amount);
        } else {
            $result['shortage_amount'] = (float) ($amount - $currentBalance);
        }

        return $result;
    }

    /**
     * Process a balance transaction (debit or credit)
     *
     * @param array $data
     * @param int|null $userId
     * @return array
     */
    public function processBalanceTransaction(array $data, ?int $userId = null): array
    {
        return DB::transaction(function () use ($data, $userId) {
            $employee = Employees::find($data['employee_id']);
            $benefitType = BenefitTypes::find($data['benefit_type_id']);
            
            if (!$employee) {
                throw new Exception('Employee not found');
            }
            
            if (!$benefitType) {
                throw new Exception('Benefit type not found');
            }

            // Get benefit budget
            // Apply business rules: Supervisors (level_employee_id = 2) get budget with marriage_status_id = null
            $benefitBudget = BenefitBudgets::where('benefit_type_id', $data['benefit_type_id'])
                ->where('level_employee_id', $employee->level_employee_id)
                ->where('year', $data['year'])
                ->where(function($query) use ($employee) {
                    if ($employee->level_employee_id == 2) {
                        // Supervisor: use budget with null marriage_status_id
                        $query->whereNull('marriage_status_id');
                    } else {
                        // Staff and others: use budget matching their marriage_status_id
                        $query->where('marriage_status_id', $employee->marriage_status_id);
                    }
                })
                ->first();

            if (!$benefitBudget) {
                throw new Exception('No benefit budget found for this employee and benefit type');
            }

            // Get or create employee balance record
            $employeeBalance = EmployeeBenefitBalances::firstOrCreate(
                [
                    'employee_id' => $data['employee_id'],
                    'benefit_budget_id' => $benefitBudget->id,
                ],
                [
                    'current_balance' => $benefitBudget->budget,
                ]
            );

            $balanceBefore = $employeeBalance->current_balance;
            
            // Calculate new balance
            if ($data['transaction_type'] === 'debit') {
                $balanceAfter = $balanceBefore - $data['amount'];
                
                // Check overdraft limit for debit transactions
                $overdraftLimit = $this->getOverdraftLimit($benefitBudget->budget, $benefitType->name);
                $wouldExceedLimit = $balanceAfter < $overdraftLimit;
                
                // Allow override for emergency or pre-approved transactions
                $allowOverdraft = isset($data['allow_overdraft']) && $data['allow_overdraft'] === true;
                $isEmergency = isset($data['is_emergency']) && $data['is_emergency'] === true;
                
                if ($wouldExceedLimit && !$allowOverdraft && !$isEmergency) {
                    $shortage = abs($overdraftLimit - $balanceAfter);
                    throw new Exception("Transaction would exceed overdraft limit. Current balance: " . number_format($balanceBefore) . 
                                      ", Overdraft limit: " . number_format($overdraftLimit) . 
                                      ", Shortage: " . number_format($shortage));
                }
            } else {
                $balanceAfter = $balanceBefore + $data['amount'];
            }

            // Update employee balance
            $employeeBalance->current_balance = $balanceAfter;
            $employeeBalance->save();

            // Create balance transaction record
            $transaction = BalanceTransaction::create([
                'transaction_id' => BalanceTransaction::generateTransactionId(),
                'employee_id' => $data['employee_id'],
                'benefit_type_id' => $data['benefit_type_id'],
                'transaction_type' => $data['transaction_type'],
                'amount' => $data['amount'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference_type' => $data['reference_type'],
                'reference_id' => $data['reference_id'] ?? null,
                'description' => $data['description'] ?? null,
                'processed_by' => $userId,
                'year' => $data['year'],
            ]);

            // Clear relevant cache
            $this->clearBalanceCache($data['employee_id'], $data['year']);

            return [
                'transaction_id' => $transaction->transaction_id,
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'nik' => $employee->nik,
                ],
                'benefit_type' => [
                    'id' => $benefitType->id,
                    'name' => $benefitType->name,
                ],
                'transaction_type' => $data['transaction_type'],
                'amount' => (float) $data['amount'],
                'balance_before' => (float) $balanceBefore,
                'balance_after' => (float) $balanceAfter,
                'reference_type' => $data['reference_type'],
                'reference_id' => $data['reference_id'] ?? null,
                'description' => $data['description'] ?? null,
                'processed_at' => $transaction->created_at->toISOString(),
                'processed_by' => $userId ? [
                    'id' => $userId,
                    'name' => User::find($userId)->name ?? 'Unknown',
                ] : null,
            ];
        });
    }

    /**
     * Manual balance adjustment
     *
     * @param array $data
     * @param int|null $userId
     * @return array
     */
    public function adjustBalance(array $data, ?int $userId = null): array
    {
        $transactionData = [
            'employee_id' => $data['employee_id'],
            'benefit_type_id' => $data['benefit_type_id'],
            'transaction_type' => $data['adjustment_type'] === 'increase' ? 'credit' : 'debit',
            'amount' => $data['amount'],
            'reference_type' => 'adjustment',
            'description' => 'Manual adjustment: ' . $data['reason'],
            'year' => $data['year'],
        ];

        $result = $this->processBalanceTransaction($transactionData, $userId);
        
        // Generate adjustment ID for response
        $adjustmentId = 'ADJ-' . now()->format('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        return [
            'adjustment_id' => $adjustmentId,
            'employee' => $result['employee'],
            'benefit_type' => $result['benefit_type'],
            'adjustment_type' => $data['adjustment_type'],
            'amount' => $result['amount'],
            'balance_before' => $result['balance_before'],
            'balance_after' => $result['balance_after'],
            'reason' => $data['reason'],
            'adjusted_at' => $result['processed_at'],
            'adjusted_by' => $result['processed_by'],
        ];
    }

    /**
     * Get balance history for an employee
     *
     * @param int $employeeId
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getBalanceHistory(int $employeeId, array $filters = [])
    {
        $query = BalanceTransaction::with(['benefitType', 'processedBy'])
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['benefit_type_id'])) {
            $query->where('benefit_type_id', $filters['benefit_type_id']);
        }

        if (!empty($filters['year'])) {
            $query->where('year', $filters['year']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        if (!empty($filters['transaction_type'])) {
            $query->where('transaction_type', $filters['transaction_type']);
        }

        $perPage = $filters['per_page'] ?? 20;
        
        return $query->paginate($perPage);
    }

    /**
     * Recalculate employee balances based on historical claims
     *
     * @param array $data
     * @return array
     */
    public function recalculateBalances(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $year = $data['year'];
            $employeeIds = $data['employee_ids'] ?? [];
            $benefitTypeIds = $data['benefit_type_ids'] ?? [];
            
            $query = Employees::query();
            
            if (!empty($employeeIds)) {
                $query->whereIn('id', $employeeIds);
            }
            
            $employees = $query->get();
            $recalculatedEmployees = 0;
            $recalculatedBalances = 0;
            $discrepancies = [];

            foreach ($employees as $employee) {
                // Get benefit budgets for this employee
                // Apply business rules: Supervisors (level_employee_id = 2) get budget with marriage_status_id = null
                $budgetQuery = BenefitBudgets::where('year', $year)
                    ->where('level_employee_id', $employee->level_employee_id)
                    ->where(function($query) use ($employee) {
                        if ($employee->level_employee_id == 2) {
                            // Supervisor: use budget with null marriage_status_id
                            $query->whereNull('marriage_status_id');
                        } else {
                            // Staff and others: use budget matching their marriage_status_id
                            $query->where('marriage_status_id', $employee->marriage_status_id);
                        }
                    });
                
                if (!empty($benefitTypeIds)) {
                    $budgetQuery->whereIn('benefit_type_id', $benefitTypeIds);
                }
                
                $budgets = $budgetQuery->get();
                
                foreach ($budgets as $budget) {
                    // Calculate used amount from approved claims
                    $usedAmount = BenefitClaims::where('employee_id', $employee->id)
                        ->where('benefit_type_id', $budget->benefit_type_id)
                        ->whereYear('claim_date', $year)
                        ->where('status', 'approved')
                        ->sum('amount');
                    
                    $calculatedBalance = $budget->budget - $usedAmount;
                    
                    // Get current balance record
                    $employeeBalance = EmployeeBenefitBalances::where('employee_id', $employee->id)
                        ->where('benefit_budget_id', $budget->id)
                        ->first();
                    
                    $oldBalance = $employeeBalance ? $employeeBalance->current_balance : $budget->budget;
                    
                    // Check for discrepancies
                    if (abs($oldBalance - $calculatedBalance) > 0.01) {
                        $discrepancies[] = [
                            'employee_id' => $employee->id,
                            'benefit_type_id' => $budget->benefit_type_id,
                            'old_balance' => (float) $oldBalance,
                            'calculated_balance' => (float) $calculatedBalance,
                            'difference' => (float) ($calculatedBalance - $oldBalance),
                        ];
                    }
                    
                    // Update or create balance record
                    EmployeeBenefitBalances::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'benefit_budget_id' => $budget->id,
                        ],
                        [
                            'current_balance' => $calculatedBalance,
                        ]
                    );
                    
                    $recalculatedBalances++;
                }
                
                $recalculatedEmployees++;
                
                // Clear cache for this employee
                $this->clearBalanceCache($employee->id, $year);
            }

            return [
                'recalculated_employees' => $recalculatedEmployees,
                'recalculated_balances' => $recalculatedBalances,
                'year' => $year,
                'discrepancies_found' => count($discrepancies),
                'discrepancies' => $discrepancies,
                'processed_at' => now()->toISOString(),
            ];
        });
    }

    /**
     * Get low balance alerts
     *
     * @param float $thresholdPercentage
     * @param int $year
     * @return array
     */
    public function getLowBalanceAlerts(float $thresholdPercentage, int $year): array
    {
        $cacheKey = "low_balance_alerts_{$thresholdPercentage}_{$year}";
        
        return Cache::remember($cacheKey, 300, function () use ($thresholdPercentage, $year) {
            $alerts = [];
            
            // Get all employee benefit balances for the year
            $balances = EmployeeBenefitBalances::with([
                'employee',
                'benefitBudget.benefitType'
            ])
            ->whereHas('benefitBudget', function ($query) use ($year) {
                $query->where('year', $year);
            })
            ->get();

            foreach ($balances as $balance) {
                $initialBalance = $balance->benefitBudget->budget;
                $currentBalance = $balance->current_balance;
                $usedAmount = $initialBalance - $currentBalance;
                $usagePercentage = $initialBalance > 0 ? ($usedAmount / $initialBalance) * 100 : 0;
                $remainingPercentage = 100 - $usagePercentage;
                
                // Get overdraft limit for this benefit type
                $overdraftLimit = $this->getOverdraftLimit($initialBalance, $balance->benefitBudget->benefitType->name);

                // Determine alert level based on balance status
                $alertLevel = 'warning';
                $isOverdrawn = $currentBalance < 0;
                $exceedsOverdraft = $currentBalance < $overdraftLimit;
                
                if ($exceedsOverdraft) {
                    $alertLevel = 'critical_overdraft_exceeded';
                } elseif ($isOverdrawn) {
                    $alertLevel = 'critical_overdrawn';
                } elseif ($remainingPercentage <= 5) {
                    $alertLevel = 'critical';
                } elseif ($remainingPercentage <= 10) {
                    $alertLevel = 'high';
                } elseif ($remainingPercentage <= 20) {
                    $alertLevel = 'warning';
                }

                // Check if balance is below threshold OR overdrawn
                if ($remainingPercentage <= $thresholdPercentage || $isOverdrawn) {
                    $alerts[] = [
                        'employee' => [
                            'id' => $balance->employee->id,
                            'name' => $balance->employee->name,
                            'nik' => $balance->employee->nik,
                            'department' => $balance->employee->department,
                        ],
                        'benefit_type' => [
                            'id' => $balance->benefitBudget->benefitType->id,
                            'name' => $balance->benefitBudget->benefitType->name,
                        ],
                        'initial_balance' => (float) $initialBalance,
                        'current_balance' => (float) $currentBalance,
                        'used_amount' => (float) $usedAmount,
                        'usage_percentage' => round($usagePercentage, 2),
                        'remaining_percentage' => round($remainingPercentage, 2),
                        'alert_level' => $alertLevel,
                        'overdraft_info' => [
                            'is_overdrawn' => $isOverdrawn,
                            'overdraft_amount' => $isOverdrawn ? abs($currentBalance) : 0,
                            'overdraft_limit' => (float) $overdraftLimit,
                            'exceeds_overdraft_limit' => $exceedsOverdraft,
                            'available_overdraft' => max(0, $currentBalance - $overdraftLimit),
                        ],
                    ];
                }
            }

            return [
                'threshold_percentage' => $thresholdPercentage,
                'alerts' => $alerts,
                'total_alerts' => count($alerts),
            ];
        });
    }

    /**
     * Process claim and update balance automatically
     *
     * @param BenefitClaims $claim
     * @param string $action (created, updated, deleted)
     * @param float|null $oldAmount
     * @return void
     */
    public function processClaimBalanceUpdate(BenefitClaims $claim, string $action, ?float $oldAmount = null): void
    {
        // Only process approved claims for balance transactions
        if ($claim->status !== 'approved') {
            return;
        }
        
        $year = $claim->claim_date->year;

        try {
            switch ($action) {
                case 'created':
                    $this->processBalanceTransaction([
                        'employee_id' => $claim->employee_id,
                        'benefit_type_id' => $claim->benefit_type_id,
                        'transaction_type' => 'debit',
                        'amount' => $claim->amount,
                        'reference_type' => 'claim',
                        'reference_id' => $claim->id,
                        'description' => "Claim processing: {$claim->description} (Status: {$claim->status})",
                        'year' => $year,
                        'is_emergency' => $claim->is_emergency ?? false,
                        'allow_overdraft' => $claim->allow_overdraft ?? false,
                    ]);
                    break;

                case 'updated':
                    if ($oldAmount && $oldAmount !== $claim->amount) {
                        // Restore old amount
                        $this->processBalanceTransaction([
                            'employee_id' => $claim->employee_id,
                            'benefit_type_id' => $claim->benefit_type_id,
                            'transaction_type' => 'credit',
                            'amount' => $oldAmount,
                            'reference_type' => 'claim',
                            'reference_id' => $claim->id,
                            'description' => "Claim update reversal: {$claim->description}",
                            'year' => $year,
                        ]);

                        // Deduct new amount
                        $this->processBalanceTransaction([
                            'employee_id' => $claim->employee_id,
                            'benefit_type_id' => $claim->benefit_type_id,
                            'transaction_type' => 'debit',
                            'amount' => $claim->amount,
                            'reference_type' => 'claim',
                            'reference_id' => $claim->id,
                            'description' => "Claim update: {$claim->description}",
                            'year' => $year,
                        ]);
                    }
                    break;

                case 'deleted':
                    // Restore amount when claim is deleted
                    $this->processBalanceTransaction([
                        'employee_id' => $claim->employee_id,
                        'benefit_type_id' => $claim->benefit_type_id,
                        'transaction_type' => 'credit',
                        'amount' => $claim->amount,
                        'reference_type' => 'claim',
                        'reference_id' => $claim->id,
                        'description' => "Claim deletion reversal: {$claim->description}",
                        'year' => $year,
                    ]);
                    break;
            }
        } catch (Exception $e) {
            Log::error("Failed to process claim balance update: " . $e->getMessage(), [
                'claim_id' => $claim->id,
                'action' => $action,
                'employee_id' => $claim->employee_id,
                'amount' => $claim->amount,
                'status' => $claim->status,
            ]);
            throw $e;
        }
    }

    /**
     * Get overdraft limit based on benefit type and initial budget
     *
     * @param float $initialBudget
     * @param string $benefitTypeName
     * @return float
     */
    private function getOverdraftLimit(float $initialBudget, string $benefitTypeName): float
    {
        // Define overdraft limits as percentage of initial budget
        $overdraftRules = [
            'medical' => 0.5,      // Allow 50% overdraft for medical (emergency situations)
            'dental' => 0.2,       // Allow 20% overdraft for dental
            'maternity' => 0.3,    // Allow 30% overdraft for maternity
            'glasses' => 0.1,      // Allow 10% overdraft for glasses
        ];

        $defaultOverdraftPercentage = 0.25; // Default 25% overdraft

        $overdraftPercentage = $overdraftRules[strtolower($benefitTypeName)] ?? $defaultOverdraftPercentage;
        
        // Return negative value as overdraft limit (e.g., -450,000 for 900,000 budget with 50% overdraft)
        return -($initialBudget * $overdraftPercentage);
    }

    /**
     * Get detailed balance status including overdraft information
     *
     * @param int $employeeId
     * @param int $benefitTypeId
     * @param int $year
     * @return array
     */
    public function getBalanceStatus(int $employeeId, int $benefitTypeId, int $year): array
    {
        $employee = Employees::find($employeeId);
        $benefitType = BenefitTypes::find($benefitTypeId);
        
        if (!$employee || !$benefitType) {
            throw new Exception('Employee or benefit type not found');
        }

        // Get benefit budget
        // Apply business rules: Supervisors (level_employee_id = 2) get budget with marriage_status_id = null
        $benefitBudget = BenefitBudgets::where('benefit_type_id', $benefitTypeId)
            ->where('level_employee_id', $employee->level_employee_id)
            ->where('year', $year)
            ->where(function($query) use ($employee) {
                if ($employee->level_employee_id == 2) {
                    // Supervisor: use budget with null marriage_status_id
                    $query->whereNull('marriage_status_id');
                } else {
                    // Staff and others: use budget matching their marriage_status_id
                    $query->where('marriage_status_id', $employee->marriage_status_id);
                }
            })
            ->first();

        if (!$benefitBudget) {
            throw new Exception('No benefit budget found for this employee and benefit type');
        }

        // Get current balance
        $employeeBalance = EmployeeBenefitBalances::where('employee_id', $employeeId)
            ->where('benefit_budget_id', $benefitBudget->id)
            ->first();

        $currentBalance = $employeeBalance ? $employeeBalance->current_balance : $benefitBudget->budget;
        $initialBudget = $benefitBudget->budget;
        $overdraftLimit = $this->getOverdraftLimit($initialBudget, $benefitType->name);
        $usedAmount = $initialBudget - $currentBalance;

        // Determine status
        $status = 'sufficient';
        if ($currentBalance < 0) {
            $status = $currentBalance >= $overdraftLimit ? 'overdraft_allowed' : 'overdraft_exceeded';
        } elseif ($currentBalance < ($initialBudget * 0.2)) {
            $status = 'low_balance';
        }

        return [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'nik' => $employee->nik,
            ],
            'benefit_type' => [
                'id' => $benefitType->id,
                'name' => $benefitType->name,
            ],
            'balance_info' => [
                'initial_budget' => (float) $initialBudget,
                'current_balance' => (float) $currentBalance,
                'used_amount' => (float) $usedAmount,
                'overdraft_limit' => (float) $overdraftLimit,
                'available_credit' => (float) max(0, $currentBalance),
                'available_overdraft' => (float) max(0, $currentBalance - $overdraftLimit),
                'status' => $status,
                'is_overdrawn' => $currentBalance < 0,
                'overdraft_amount' => $currentBalance < 0 ? abs($currentBalance) : 0,
                'usage_percentage' => $initialBudget > 0 ? round(($usedAmount / $initialBudget) * 100, 2) : 0,
            ],
            'year' => $year,
        ];
    }

    /**
     * Clear balance cache for an employee
     *
     * @param int $employeeId
     * @param int $year
     * @return void
     */
    private function clearBalanceCache(int $employeeId, int $year): void
    {
        $cacheKeys = [
            "employee_balance_summary_{$employeeId}_{$year}",
            "low_balance_alerts_{$year}",
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }
    }
} 