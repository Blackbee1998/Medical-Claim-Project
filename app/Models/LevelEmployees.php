<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LevelEmployees extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'level_employees';

    protected $fillable = [
        'name'
    ];
}
