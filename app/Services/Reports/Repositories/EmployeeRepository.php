<?php

namespace App\Services\Reports\Repositories;

use App\Models\Employees;
use App\Models\BenefitBudgets;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;

class EmployeeRepository
{
    /**
     * Get employees with benefit budgets for a specific year
     *
     * @param int $year
     * @param array $filters
     * @return Collection
     */
    public function getEmployeesWithBudgets(int $year, array $filters = []): Collection
    {
        $query = Employees::with(['levelEmployees', 'marriageStatuses'])
            ->whereHas('employeeBenefitBalances.benefitBudget', function ($q) use ($year) {
                $q->where('year', $year);
            });

        // Apply department filter
        if (!empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        // Apply employee level filter
        if (!empty($filters['employee_level_id'])) {
            $query->where('level_employee_id', $filters['employee_level_id']);
        }

        return $query->get();
    }

    /**
     * Get benefit budgets for an employee in a specific year
     *
     * @param int $employeeId
     * @param int $levelEmployeeId
     * @param int|null $marriageStatusId
     * @param int $year
     * @return Collection
     */
    public function getEmployeeBenefitBudgets(int $employeeId, int $levelEmployeeId, ?int $marriageStatusId, int $year): Collection
    {
        return BenefitBudgets::where('year', $year)
            ->where('level_employee_id', $levelEmployeeId)
            ->where(function ($q) use ($marriageStatusId) {
                $q->whereNull('marriage_status_id')
                  ->orWhere('marriage_status_id', $marriageStatusId);
            })
            ->with('benefitType')
            ->get();
    }

    /**
     * Calculate employee utilization data
     *
     * @param Employees $employee
     * @param int $year
     * @param ClaimsRepository $claimsRepository
     * @return array
     */
    public function calculateEmployeeUtilization(Employees $employee, int $year, ClaimsRepository $claimsRepository): array
    {
        // Get employee's benefit budgets for the year
        $benefitBudgets = $this->getEmployeeBenefitBudgets(
            $employee->id,
            $employee->level_employee_id,
            $employee->marriage_status_id,
            $year
        );

        $totalAllocation = $benefitBudgets->sum('budget');

        // Get employee's claims for the year
        $claims = $claimsRepository->getEmployeeClaimsForYear($employee->id, $year);

        $totalUsed = $claims->sum('amount');
        $remainingBalance = $totalAllocation - $totalUsed;
        $usagePercentage = $totalAllocation > 0 ? ($totalUsed / $totalAllocation) * 100 : 0;

        // Categorize utilization
        $category = 'normal';
        if ($usagePercentage >= 80) {
            $category = 'high';
        } elseif ($usagePercentage <= 30) {
            $category = 'low';
        }

        // Calculate benefit breakdown
        $benefitBreakdown = [];
        foreach ($benefitBudgets as $budget) {
            $benefitClaims = $claims->where('benefit_type_id', $budget->benefit_type_id);
            $used = $benefitClaims->sum('amount');
            $percentage = $budget->budget > 0 ? ($used / $budget->budget) * 100 : 0;

            $benefitBreakdown[] = [
                'benefit_type' => $budget->benefitType->name,
                'allocated' => $budget->budget,
                'used' => $used,
                'percentage' => round($percentage, 2),
            ];
        }

        return [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'nik' => $employee->nik,
                'department' => $employee->department,
                'level' => $employee->levelEmployees->name ?? 'Unknown',
            ],
            'total_allocation' => $totalAllocation,
            'total_used' => $totalUsed,
            'remaining_balance' => $remainingBalance,
            'usage_percentage' => round($usagePercentage, 2),
            'claims_count' => $claims->count(),
            'average_claim_amount' => $claims->count() > 0 ? $claims->average('amount') : 0,
            'last_claim_date' => $claims->sortByDesc('claim_date')->first()?->claim_date?->toDateString(),
            'utilization_category' => $category,
            'benefit_breakdown' => $benefitBreakdown,
        ];
    }
} 