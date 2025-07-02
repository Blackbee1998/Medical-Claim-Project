<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Models\BenefitClaims;
use App\Models\BenefitBudgets;
use App\Models\EmployeeBenefitBalances;

class BenefitClaimService
{
    public function getFilteredClaims(Request $request)
    {
        $query = BenefitClaims::with(['employee', 'benefitType']);

        // Apply filters
        $this->applyFilters($query, $request);

        // Apply sorting
        $sortBy = $request->get('sort_by', 'claim_date');
        $sortDir = $request->get('sort_dir', 'desc');
        
        // Enhanced sorting logic to handle relationship fields
        $this->applySorting($query, $sortBy, $sortDir);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100); // Max 100 per page
        
        return $query->paginate($perPage);
    }

    public function applyFilters($query, Request $request)
    {
        // Filter by employee ID
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by benefit type ID
        if ($request->filled('benefit_type_id')) {
            $query->where('benefit_type_id', $request->benefit_type_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->where('claim_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('claim_date', '<=', $request->end_date);
        }

        // Filter by amount range
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }

        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('employee', function($employeeQuery) use ($search) {
                    $employeeQuery->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('nik', 'LIKE', "%{$search}%");
                })
                ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }
    }

    /**
     * Apply sorting logic with support for relationship-based fields
     */
    private function applySorting($query, $sortBy, $sortDir)
    {
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';
        
        switch ($sortBy) {
            case 'employee_name':
                $query->join('employees', 'benefit_claims.employee_id', '=', 'employees.id')
                      ->orderBy('employees.name', $sortDir)
                      ->select('benefit_claims.*');
                break;
                
            case 'department':
                $query->join('employees', 'benefit_claims.employee_id', '=', 'employees.id')
                      ->orderBy('employees.department', $sortDir)
                      ->select('benefit_claims.*');
                break;
                
            case 'benefit_type':
                $query->join('benefit_types', 'benefit_claims.benefit_type_id', '=', 'benefit_types.id')
                      ->orderBy('benefit_types.name', $sortDir)
                      ->select('benefit_claims.*');
                break;
                
            case 'status':
                $query->orderBy('benefit_claims.status', $sortDir);
                break;
                
            case 'id':
            case 'claim_date':
            case 'amount':
            case 'created_at':
            case 'updated_at':
                $query->orderBy("benefit_claims.{$sortBy}", $sortDir);
                break;
                
            default:
                // Fallback to default sorting
                $query->orderBy('benefit_claims.claim_date', 'desc');
                break;
        }
    }

    public function getSummaryData()
    {
        $totalAmount = BenefitClaims::sum('amount');
        $totalClaims = BenefitClaims::count();
        $averageAmount = $totalClaims > 0 ? $totalAmount / $totalClaims : 0;

        return [
            'total_amount' => (float) $totalAmount,
            'total_claims' => $totalClaims,
            'average_claim_amount' => (float) number_format($averageAmount, 2, '.', '')
        ];
    }

    public function getBalanceInfo(BenefitClaims $claim)
    {
        $balanceData = [
            'balance_before' => 0.00,
            'balance_after' => 0.00,
            'current_balance' => 0.00
        ];
            // Get current year from claim date
            $year = $claim->claim_date->year;
            
            // Find benefit budget based on employee's level, marriage status, and benefit type
            $benefitBudget = BenefitBudgets::where('benefit_type_id', $claim->benefit_type_id)
                ->where('level_employee_id', $claim->employee->level_employee_id)
                ->where('year', $year)
                ->where(function($query) use ($claim) {
                    $query->where('marriage_status_id', $claim->employee->marriage_status_id)
                          ->orWhereNull('marriage_status_id');
                })
                ->first();

            if ($benefitBudget) {
                // Get employee benefit balance
                $employeeBalance = EmployeeBenefitBalances::where('employee_id', $claim->employee_id)
                    ->where('benefit_budget_id', $benefitBudget->id)
                    ->first();

                if ($employeeBalance) {
                    $currentBalance = (float) $employeeBalance->current_balance;
                    $claimAmount = (float) $claim->amount;

                    $balanceData = [
                        'balance_before' => $currentBalance + $claimAmount,
                        'balance_after' => $currentBalance,
                        'current_balance' => $currentBalance
                    ];
                }
            }
        return $balanceData;
    }
}
