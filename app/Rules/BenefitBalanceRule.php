<?php

namespace App\Rules;

use App\Models\Employees;
use App\Models\BenefitBudgets;
use App\Models\EmployeeBenefitBalances;
use App\Models\BenefitTypes;
use Illuminate\Contracts\Validation\Rule;

class BenefitBalanceRule implements Rule
{
    protected $employeeId;
    protected $claimDate;
    protected $benefitTypeId;
    protected $requestedAmount;
    protected $availableBalance;
    protected $benefitTypeName;

    public function __construct($employeeId, $claimDate, $benefitTypeId)
    {
        $this->employeeId = $employeeId;
        $this->claimDate = $claimDate;
        $this->benefitTypeId = $benefitTypeId;
    }

    public function passes($attribute, $value)
    {
        $this->requestedAmount = (float) $value;
        $this->availableBalance = 0; // Initialize dengan 0

        // Get employee data
        $employee = Employees::find($this->employeeId);
        if (!$employee) {
            // \Log::error('Employee not found', ['employee_id' => $this->employeeId]);
            return false;
        }

        // \Log::info('Employee found:', ['employee' => $employee]);

        // Get benefit type name for response
        $benefitType = BenefitTypes::find($this->benefitTypeId);
        $this->benefitTypeName = $benefitType ? $benefitType->name : 'Unknown';

        // Get year from claim_date
        $year = date('Y', strtotime($this->claimDate));

        // Determine marriage_status_id based on level_employee_id
        $marriageStatusId = $this->getMarriageStatusForLevel($employee->level_employee_id, $employee->marriage_status_id);

        // \Log::info('Marriage status logic:', [
        //     'original_marriage_status_id' => $employee->marriage_status_id,
        //     'level_employee_id' => $employee->level_employee_id,
        //     'final_marriage_status_id' => $marriageStatusId
        // ]);

        // Find benefit budget based on employee's level, adjusted marriage status, and benefit type
        $benefitBudgetQuery = BenefitBudgets::where('benefit_type_id', $this->benefitTypeId)
            ->where('level_employee_id', $employee->level_employee_id)
            ->where('year', $year);

        // Add marriage_status condition based on the logic
        if ($marriageStatusId === null) {
            $benefitBudgetQuery->whereNull('marriage_status_id');
        } else {
            $benefitBudgetQuery->where('marriage_status_id', $marriageStatusId);
        }

        $benefitBudget = $benefitBudgetQuery->first();

        // \Log::info('Benefit budget query:', [
        //     'benefit_type_id' => $this->benefitTypeId,
        //     'level_employee_id' => $employee->level_employee_id,
        //     'marriage_status_id' => $marriageStatusId,
        //     'year' => $year,
        //     'result' => $benefitBudget
        // ]);

        if (!$benefitBudget) {
            // \Log::error('Benefit budget not found');
            return false;
        }

        // Get current balance from employee_benefit_balances
        $employeeBalance = EmployeeBenefitBalances::where('employee_id', $this->employeeId)
            ->where('benefit_budget_id', $benefitBudget->id)
            ->first();

        // \Log::info('Employee balance:', ['balance' => $employeeBalance]);

        if (!$employeeBalance || $employeeBalance->current_balance === null) {
            // \Log::error('Employee balance not found or current_balance is null');
            $this->availableBalance = 0;
            return false;
        }

        $this->availableBalance = (float) $employeeBalance->current_balance;
        // \Log::info('Available balance:', ['balance' => $this->availableBalance]);

        // Check if requested amount is within available balance
        return $this->requestedAmount <= $this->availableBalance;
    }

    /**
     * Determine marriage status based on employee level
     *
     * @param int $levelEmployeeId
     * @param int|null $originalMarriageStatusId
     * @return int|null
     */
    private function getMarriageStatusForLevel($levelEmployeeId, $originalMarriageStatusId)
    {
        // Jika level employee adalah 2, maka marriage_status otomatis null
        if ($levelEmployeeId == 2) {
            return null;
        }

        // Untuk level employee lainnya, gunakan marriage_status asli
        return $originalMarriageStatusId;
    }

    public function message()
    {
        return json_encode([
            'status' => 400,
            'message' => 'Insufficient benefit balance',
            'data' => [
                'requested_amount' => $this->requestedAmount,
                'available_balance' => $this->availableBalance,
                'benefit_type' => $this->benefitTypeName
            ]
        ]);
    }

    public function getValidationData()
    {
        return [
            'requested_amount' => $this->requestedAmount,
            'available_balance' => $this->availableBalance,
            'benefit_type' => $this->benefitTypeName
        ];
    }
}
