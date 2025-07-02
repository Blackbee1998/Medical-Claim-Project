<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BalanceTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'employee_id',
        'benefit_type_id',
        'transaction_type',
        'amount',
        'balance_before',
        'balance_after',
        'reference_type',
        'reference_id',
        'description',
        'processed_by',
        'year',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'year' => 'integer',
    ];

    /**
     * Relationship with Employee
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employees::class);
    }

    /**
     * Relationship with Benefit Type
     */
    public function benefitType(): BelongsTo
    {
        return $this->belongsTo(BenefitTypes::class);
    }

    /**
     * Relationship with User (who processed the transaction)
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Generate unique transaction ID
     */
    public static function generateTransactionId(): string
    {
        $currentDate = now()->format('Ymd');
        $latestTransaction = self::where('transaction_id', 'like', "TXN-{$currentDate}-%")->latest('id')->first();
        
        if ($latestTransaction) {
            $lastNumber = (int) substr($latestTransaction->transaction_id, -3);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }
        
        return "TXN-{$currentDate}-{$newNumber}";
    }

    /**
     * Scope for debit transactions
     */
    public function scopeDebits($query)
    {
        return $query->where('transaction_type', 'debit');
    }

    /**
     * Scope for credit transactions
     */
    public function scopeCredits($query)
    {
        return $query->where('transaction_type', 'credit');
    }

    /**
     * Scope for specific employee
     */
    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Scope for specific benefit type
     */
    public function scopeByBenefitType($query, $benefitTypeId)
    {
        return $query->where('benefit_type_id', $benefitTypeId);
    }

    /**
     * Scope for specific year
     */
    public function scopeByYear($query, $year)
    {
        return $query->where('year', $year);
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope for specific reference type
     */
    public function scopeByReferenceType($query, $referenceType)
    {
        return $query->where('reference_type', $referenceType);
    }
}
