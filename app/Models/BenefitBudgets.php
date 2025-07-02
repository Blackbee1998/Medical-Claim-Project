<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BenefitBudgets extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'benefit_budget';
    protected $fillable = [
        'benefit_type_id',
        'level_employee_id',
        'marriage_status_id',
        'year',
        'budget',
    ];

    public function benefitType()
    {
        return $this->belongsTo(BenefitTypes::class, 'benefit_type_id');
    }

    public function levelEmployees()
    {
        return $this->belongsTo(LevelEmployees::class, 'level_employee_id');
    }

    public function marriageStatus()
    {
        return $this->belongsTo(MarriageStatuses::class, 'marriage_status_id');
    }
}
