<?php

namespace App\Services\Reports\Repositories;

use App\Models\BenefitBudgets;
use App\Models\LevelEmployees;
use App\Models\BenefitTypes;
use Illuminate\Database\Eloquent\Collection;

class BudgetRepository
{
    /**
     * Get budget groups based on grouping criteria
     *
     * @param string $groupBy
     * @param int $year
     * @return array
     */
    public function getBudgetGroups(string $groupBy, int $year): array
    {
        switch ($groupBy) {
            case 'department':
                return $this->getDepartmentGroups($year);
            case 'benefit_type':
                return $this->getBenefitTypeGroups($year);
            case 'employee_level':
                return $this->getEmployeeLevelGroups($year);
            default:
                return [];
        }
    }

    /**
     * Get department groups
     *
     * @param int $year
     * @return array
     */
    private function getDepartmentGroups(int $year): array
    {
        $budgets = BenefitBudgets::where('year', $year)
            ->with(['levelEmployee', 'benefitType'])
            ->get();

        // Get unique departments through level employees
        $departments = $budgets->pluck('levelEmployee.employees.*.department')
            ->flatten()
            ->unique()
            ->filter()
            ->values()
            ->all();

        return array_map(function ($department) {
            return [
                'id' => $department,
                'name' => $department,
                'type' => 'department'
            ];
        }, $departments);
    }

    /**
     * Get benefit type groups
     *
     * @param int $year
     * @return array
     */
    private function getBenefitTypeGroups(int $year): array
    {
        $benefitTypes = BenefitTypes::whereHas('benefitBudgets', function ($q) use ($year) {
            $q->where('year', $year);
        })->get();

        return $benefitTypes->map(function ($benefitType) {
            return [
                'id' => $benefitType->id,
                'name' => $benefitType->name,
                'type' => 'benefit_type'
            ];
        })->toArray();
    }

    /**
     * Get employee level groups
     *
     * @param int $year
     * @return array
     */
    private function getEmployeeLevelGroups(int $year): array
    {
        $levelEmployees = LevelEmployees::whereHas('benefitBudgets', function ($q) use ($year) {
            $q->where('year', $year);
        })->get();

        return $levelEmployees->map(function ($level) {
            return [
                'id' => $level->id,
                'name' => $level->name,
                'type' => 'employee_level'
            ];
        })->toArray();
    }

    /**
     * Calculate budget vs actual for a specific group
     *
     * @param array $group
     * @param string $groupBy
     * @param int $year
     * @param ClaimsRepository $claimsRepository
     * @return array
     */
    public function calculateBudgetVsActualForGroup(
        array $group, 
        string $groupBy, 
        int $year, 
        ClaimsRepository $claimsRepository
    ): array {
        $budgetTotal = 0;
        $actualTotal = 0;

        switch ($groupBy) {
            case 'department':
                $budgetTotal = $this->getDepartmentBudget($group['name'], $year);
                $actualTotal = $this->getDepartmentActual($group['name'], $year, $claimsRepository);
                break;
            case 'benefit_type':
                $budgetTotal = $this->getBenefitTypeBudget($group['id'], $year);
                $actualTotal = $this->getBenefitTypeActual($group['id'], $year, $claimsRepository);
                break;
            case 'employee_level':
                $budgetTotal = $this->getEmployeeLevelBudget($group['id'], $year);
                $actualTotal = $this->getEmployeeLevelActual($group['id'], $year, $claimsRepository);
                break;
        }

        $variance = $actualTotal - $budgetTotal;
        $variancePercentage = $budgetTotal > 0 ? ($variance / $budgetTotal) * 100 : 0;
        $utilizationRate = $budgetTotal > 0 ? ($actualTotal / $budgetTotal) * 100 : 0;

        return [
            'group_name' => $group['name'],
            'budget' => $budgetTotal,
            'actual' => $actualTotal,
            'variance' => $variance,
            'variance_percentage' => round($variancePercentage, 2),
            'utilization_rate' => round($utilizationRate, 2),
            'status' => $this->determineBudgetStatus($utilizationRate),
        ];
    }

    /**
     * Get department budget total
     *
     * @param string $department
     * @param int $year
     * @return float
     */
    private function getDepartmentBudget(string $department, int $year): float
    {
        return BenefitBudgets::where('year', $year)
            ->whereHas('levelEmployee.employees', function ($q) use ($department) {
                $q->where('department', $department);
            })
            ->sum('budget');
    }

    /**
     * Get department actual spending
     *
     * @param string $department
     * @param int $year
     * @param ClaimsRepository $claimsRepository
     * @return float
     */
    private function getDepartmentActual(string $department, int $year, ClaimsRepository $claimsRepository): float
    {
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";
        
        $claims = $claimsRepository->getClaimsForPeriod($startDate, $endDate, [
            'department' => $department
        ]);

        return $claims->sum('amount');
    }

    /**
     * Get benefit type budget total
     *
     * @param int $benefitTypeId
     * @param int $year
     * @return float
     */
    private function getBenefitTypeBudget(int $benefitTypeId, int $year): float
    {
        return BenefitBudgets::where('year', $year)
            ->where('benefit_type_id', $benefitTypeId)
            ->sum('budget');
    }

    /**
     * Get benefit type actual spending
     *
     * @param int $benefitTypeId
     * @param int $year
     * @param ClaimsRepository $claimsRepository
     * @return float
     */
    private function getBenefitTypeActual(int $benefitTypeId, int $year, ClaimsRepository $claimsRepository): float
    {
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";
        
        $claims = $claimsRepository->getClaimsForPeriod($startDate, $endDate, [
            'benefit_type_id' => $benefitTypeId
        ]);

        return $claims->sum('amount');
    }

    /**
     * Get employee level budget total
     *
     * @param int $levelEmployeeId
     * @param int $year
     * @return float
     */
    private function getEmployeeLevelBudget(int $levelEmployeeId, int $year): float
    {
        return BenefitBudgets::where('year', $year)
            ->where('level_employee_id', $levelEmployeeId)
            ->sum('budget');
    }

    /**
     * Get employee level actual spending
     *
     * @param int $levelEmployeeId
     * @param int $year
     * @param ClaimsRepository $claimsRepository
     * @return float
     */
    private function getEmployeeLevelActual(int $levelEmployeeId, int $year, ClaimsRepository $claimsRepository): float
    {
        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";
        
        $claims = $claimsRepository->getClaimsForPeriod($startDate, $endDate, [
            'employee_level_id' => $levelEmployeeId
        ]);

        return $claims->sum('amount');
    }

    /**
     * Determine budget status based on utilization
     *
     * @param float $utilization
     * @return string
     */
    private function determineBudgetStatus(float $utilization): string
    {
        if ($utilization >= 90) {
            return 'over_budget';
        } elseif ($utilization >= 80) {
            return 'near_budget';
        } elseif ($utilization >= 50) {
            return 'on_track';
        } else {
            return 'under_utilized';
        }
    }
} 