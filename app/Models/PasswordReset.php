<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
    use HasFactory;

    protected $table = 'password_resets';
    
    protected $fillable = [
        'user_id',
        'token',
        'expires_at',
        'is_used'
    ];

    protected $dates = [
        'expires_at',
    ];
    /**
     * PasswordReset tidak menggunakan updated_at
     */
    public $timestamps = false;

    protected $boolean = [
        'is_used',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
