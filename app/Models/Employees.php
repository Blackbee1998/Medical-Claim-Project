<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employees extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'level_employee_id',
        'marriage_status_id',
        'nik',
        'name',
        'department',
        'gender'
    ];

    // Relasi dengan level employee
    public function levelEmployees()
    {
        return $this->belongsTo(LevelEmployees::class, 'level_employee_id', 'id');
    }

    // Relasi dengan status pernikahan
    public function marriageStatuses()
    {
        return $this->belongsTo(MarriageStatuses::class, 'marriage_status_id', 'id');
    }

    // Relasi dengan employee benefit balances
    public function employeeBenefitBalances()
    {
        return $this->hasMany(EmployeeBenefitBalances::class, 'employee_id', 'id');
    }
}
