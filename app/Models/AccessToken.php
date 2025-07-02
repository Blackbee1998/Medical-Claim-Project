<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccessToken extends Model
{
    use HasFactory;

    protected $table = 'access_tokens';
    
    protected $fillable = [
        'user_id',
        'token',
        'refresh_token',
        'expires_at',
        'revoked_at',
    ];
    
    protected $dates = [
        'expires_at',
        'revoked_at',
    ];
    
    /**
     * Access token tidak menggunakan updated_at
     */
    public $timestamps = false;
    
    /**
     * Relasi dengan user
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
    
    /**
     * Cek apakah token masih valid
     */
    public function isValid()
    {
        return !$this->revoked_at && $this->expires_at->gt(now());
    }
}
