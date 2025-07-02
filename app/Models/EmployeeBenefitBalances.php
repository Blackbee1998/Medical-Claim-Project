<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeBenefitBalances extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'employee_id',
        'benefit_budget_id',
        'current_balance',
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
    ];

    /**
     * Relationship with Employee
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employees::class);
    }

    /**
     * Relationship with Benefit Budget
     */
    public function benefitBudget(): BelongsTo
    {
        return $this->belongsTo(BenefitBudgets::class);
    }

    /**
     * Relationship with Balance Transactions
     */
    public function balanceTransactions(): HasMany
    {
        return $this->hasMany(BalanceTransaction::class, 'employee_id', 'employee_id')
                    ->whereHas('benefitType', function($query) {
                        $query->whereColumn('benefit_types.id', 'benefit_budget.benefit_type_id');
                    });
    }

    /**
     * Scope for specific employee
     */
    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Scope for specific benefit type (through benefit budget)
     */
    public function scopeByBenefitType($query, $benefitTypeId)
    {
        return $query->whereHas('benefitBudget', function($query) use ($benefitTypeId) {
            $query->where('benefit_type_id', $benefitTypeId);
        });
    }

    /**
     * Scope for specific year (through benefit budget)
     */
    public function scopeByYear($query, $year)
    {
        return $query->whereHas('benefitBudget', function($query) use ($year) {
            $query->where('year', $year);
        });
    }
}
