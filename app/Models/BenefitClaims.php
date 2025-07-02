<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Schema;

class BenefitClaims extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'benefit_type_id',
        'amount',
        'claim_number',
        'description',
        'claim_date',
        'status',
        'notes',
        'receipt_file',
        // 'created_by', // Temporarily commented to prevent SQL errors
    ];

    protected $casts = [
        'claim_date' => 'date',
        'amount' => 'decimal:2',
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
     * Relationship with User who created the claim
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    /**
     * Generate unique claim number
     */
    public static function generateClaimNumber(): string
    {
        $currentYear = now()->year;
        $latestClaim = self::where('claim_number', 'like', "CLM-{$currentYear}-%")->latest('id')->first();
        
        if ($latestClaim) {
            $lastNumber = (int) substr($latestClaim->claim_number, -6);
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '000001';
        }
        
        return "CLM-{$currentYear}-{$newNumber}";
    }

    /**
     * Scope for approved claims
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for pending claims
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for rejected claims
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope for claims in date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('claim_date', [$startDate, $endDate]);
    }

    /**
     * Scope for claims by benefit type
     */
    public function scopeByBenefitType($query, $benefitTypeId)
    {
        return $query->where('benefit_type_id', $benefitTypeId);
    }

    /**
     * Scope for claims by employee
     */
    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Scope for claims by department
     */
    public function scopeByDepartment($query, $department)
    {
        return $query->whereHas('employee', function($q) use ($department) {
            $q->where('department', $department);
        });
    }

    /**
     * Get the fillable attributes for the model.
     * Dynamically add created_by if column exists.
     *
     * @return array
     */
    public function getFillable()
    {
        $fillable = $this->fillable;
        
        // Add created_by to fillable only if column exists
        if (Schema::hasColumn('benefit_claims', 'created_by')) {
            $fillable[] = 'created_by';
        }
        
        return $fillable;
    }
} 