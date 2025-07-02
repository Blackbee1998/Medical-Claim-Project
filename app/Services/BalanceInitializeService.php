<?php

namespace App\Services;

use App\Models\Employees;
use App\Models\BenefitBudgets;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\EmployeeBenefitBalances;

class BalanceInitializeService
{
    /**
     * Initialize employee benefit balances for a specific year
     *
     * @param int $year
     * @param array|null $employeeIds
     * @return array
     */
    public function initialize(int $year, ?array $employeeIds = null): array
    {
        // Start database transaction
        DB::beginTransaction();
        
        try {
            // Get all benefit budgets for the specified year
            $benefitBudgets = BenefitBudgets::where('year', $year)->get();
            $response = null;
            
            if ($benefitBudgets->isEmpty()) {
                $response = $this->rollbackWithMessage(404, "No benefit budgets found for year {$year}");
                return $response;
            }
            
            // Get employees based on provided IDs or all if not specified
            $employeeQuery = Employees::query();
            
            if (!empty($employeeIds)) {
                $employeeQuery->whereIn('id', $employeeIds);
            }
            
            $employees = $employeeQuery->get();
            
            if ($employees->isEmpty()) {
                $response = $this->rollbackWithMessage(404, "No employees found with the specified criteria");
                return $response;
            }
            
            $initializedCount = $this->createEmployeeBenefitBalances($employees, $benefitBudgets);
            
            // Commit transaction and prepare success response
            DB::commit();
            $response = [
                'status' => 200,
                'message' => "Employee benefit balances initialized successfully",
                'data' => [
                    'initialized_count' => $initializedCount,
                    'year' => $year
                ]
            ];
            
            return $response;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error initializing employee benefit balances: ' . $e->getMessage());
            
            return [
                'status' => 500,
                'message' => "Failed to initialize employee benefit balances: " . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Helper method to roll back transaction and return an error message
     *
     * @param int $status
     * @param string $message
     * @return array
     */
    private function rollbackWithMessage(int $status, string $message): array
    {
        DB::rollBack();
        return [
            'status' => $status,
            'message' => $message
        ];
    }

    /**
     * Create benefit balances for employees based on applicable budgets
     *
     * @param \Illuminate\Database\Eloquent\Collection $employees
     * @param \Illuminate\Database\Eloquent\Collection $benefitBudgets
     * @return int Number of initialized balances
     */
    private function createEmployeeBenefitBalances($employees, $benefitBudgets): int
    {
        $initializedCount = 0;
        
        // For each employee, initialize their benefit balances
        foreach ($employees as $employee) {
            $initializedCount += $this->createEmployeeBenefitBalancesForEmployee($employee, $benefitBudgets);
        }
        
        return $initializedCount;
    }

    /**
     * Create benefit balances for a single employee
     *
     * @param Employees $employee
     * @param \Illuminate\Database\Eloquent\Collection $benefitBudgets
     * @return int Number of initialized balances for this employee
     */
    private function createEmployeeBenefitBalancesForEmployee(Employees $employee, $benefitBudgets): int
    {
        $initializedCount = 0;
        
        foreach ($benefitBudgets as $budget) {
            // Skip if budget is not applicable to this employee
            if (!$this->isBudgetApplicableToEmployee($employee, $budget)) {
                continue;
            }
            
            // Skip if balance already exists
            if ($this->employeeBenefitBalanceExists($employee->id, $budget->id)) {
                continue;
            }
            
            // Create new balance
            EmployeeBenefitBalances::create([
                'employee_id' => $employee->id,
                'benefit_budget_id' => $budget->id,
                'current_balance' => $budget->budget
            ]);
            
            $initializedCount++;
        }
        
        return $initializedCount;
    }

    /**
     * Check if a budget is applicable to an employee based on business rules
     *
     * @param Employees $employee
     * @param BenefitBudgets $budget
     * @return bool
     */
    private function isBudgetApplicableToEmployee(Employees $employee, BenefitBudgets $budget): bool
    {
        // Guard clause: Check if employee level matches budget level
        if ($budget->level_employee_id !== $employee->level_employee_id) {
            return false;
        }

        // Business Rule 1: Supervisor gets special budget regardless of marriage status
        if ($this->isSupervisor($employee)) {
            // Supervisor should get budget with null marriage_status_id (applies to all)
            return $budget->marriage_status_id === null;
        }

        // Business Rule 2 & 3: Staff-specific logic based on gender
        if ($this->isStaff($employee)) {
            return $this->isStaffBudgetApplicable($employee, $budget);
        }

        // Fallback: original logic for other employee levels
        return $this->isDefaultBudgetApplicable($employee, $budget);
    }

    /**
     * Check if employee is a Supervisor (level_employee_id = 2)
     *
     * @param Employees $employee
     * @return bool
     */
    private function isSupervisor(Employees $employee): bool
    {
        return $employee->level_employee_id === 2;
    }

    /**
     * Check if employee is a Staff (level_employee_id = 1)
     *
     * @param Employees $employee
     * @return bool
     */
    private function isStaff(Employees $employee): bool
    {
        return $employee->level_employee_id === 1;
    }

    /**
     * Apply staff-specific budget rules based on gender
     *
     * @param Employees $employee
     * @param BenefitBudgets $budget
     * @return bool
     */
    private function isStaffBudgetApplicable(Employees $employee, BenefitBudgets $budget): bool
    {
        // Business Rule 2: Female staff gets "Belum Menikah" budget (marriage_status_id = 1)
        if ($this->isFemaleEmployee($employee)) {
            return $budget->marriage_status_id === 1; // Force "Belum Menikah" for female staff
        }

        // Business Rule 3: Male staff gets budget based on actual marriage status
        if ($this->isMaleEmployee($employee)) {
            return $budget->marriage_status_id === $employee->marriage_status_id;
        }

        // Guard clause: If gender is not specified, fall back to default logic
        return $this->isDefaultBudgetApplicable($employee, $budget);
    }

    /**
     * Check if employee is female
     *
     * @param Employees $employee
     * @return bool
     */
    private function isFemaleEmployee(Employees $employee): bool
    {
        return strtolower($employee->gender) === 'perempuan' || strtolower($employee->gender) === 'female';
    }

    /**
     * Check if employee is male
     *
     * @param Employees $employee
     * @return bool
     */
    private function isMaleEmployee(Employees $employee): bool
    {
        return strtolower($employee->gender) === 'laki-laki' || strtolower($employee->gender) === 'male';
    }

    /**
     * Apply default budget matching logic (original implementation)
     *
     * @param Employees $employee
     * @param BenefitBudgets $budget
     * @return bool
     */
    private function isDefaultBudgetApplicable(Employees $employee, BenefitBudgets $budget): bool
    {
        // Check if marriage status matches or budget applies to all (null)
        if ($budget->marriage_status_id !== null && $budget->marriage_status_id !== $employee->marriage_status_id) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if an employee benefit balance already exists
     *
     * @param int $employeeId
     * @param int $budgetId
     * @return bool
     */
    private function employeeBenefitBalanceExists(int $employeeId, int $budgetId): bool
    {
        return EmployeeBenefitBalances::where([
            'employee_id' => $employeeId,
            'benefit_budget_id' => $budgetId
        ])->exists();
    }
}