<?php

namespace App\Services;

use App\Models\AccessToken;
use App\Models\User;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class JwtService
{
    /**
     * Generate access token untuk user
     *
     * @param User $user
     * @return string
     *//**
     * Waktu expired untuk access token (dalam menit)
     */
    public const ACCESS_TOKEN_TTL = 60; // 1 jam
    
    /**
     * Waktu expired untuk refresh token (dalam hari)
     */
    public const REFRESH_TOKEN_TTL = 7; // 7 hari
    
    /**
     * Generate access token untuk user
     *
     * @param User $user
     * @return string
     */
    public function generateAccessToken(User $user)
    {
        // Set TTL untuk access token
        config(['jwt.ttl' => self::ACCESS_TOKEN_TTL]);
        
        // Generate token JWT
        return JWTAuth::fromUser($user);
    }
    
    /**
     * Generate refresh token untuk user
     * Hanya menghasilkan token sebagai pajangan untuk disimpan di tabel
     *
     * @param User $user
     * @return string
     */
    public function generateRefreshToken(User $user)
    {
         // Set TTL untuk refresh token
         config(['jwt.ttl' => self::REFRESH_TOKEN_TTL * 24 * 60]); // Konversi hari ke menit
        
         // Generate token JWT
        return JWTAuth::fromUser($user);
    }
    
    /**
     * Simpan token ke database
     *
     * @param User $user
     * @param string $accessToken
     * @param string $refreshToken
     * @return AccessToken
     */
    public function storeTokens(User $user, string $accessToken, string $refreshToken)
    {
        // Hapus token lama yang belum expired (opsional)
        // $user->accessTokens()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        
        // Simpan token baru
        return AccessToken::create([
            'user_id' => $user->id,
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_at' => now()->addMinutes(self::ACCESS_TOKEN_TTL), // Menggunakan refresh token TTL
        ]);
    }
    
    /**
     * Revoke token (menandai token sebagai tidak valid)
     *
     * @param string $token
     * @return bool
     */
    public function revokeToken(string $token)
    {
        // Hanya cek access token, bukan refresh token karena refresh token hanya pajangan
        $accessToken = AccessToken::where('token', $token)->first();
            
        if ($accessToken && !$accessToken->revoked_at) {
            $accessToken->revoked_at = now();
            $accessToken->save();
            return true;
        }
        
        return false;
    }

    /**
     * Validasi token dan dapatkan user
     *
     * @param string|null $token
     * @return User|null
     */
    public function validateToken($token)
    {
        // Return null immediately if token is null or empty
        if (!$token) {
            return null;
        }
        
        try {
            // Coba decode token
            $payload = JWTAuth::setToken($token)->getPayload();
            
            // Cek di database
            $accessToken = AccessToken::where('token', $token)
                ->whereNull('revoked_at')
                ->first();
                
            if (!$accessToken) {
                return null;
            }
            
            // Cek user
            $user = User::find($payload->get('sub'));
            if (!$user || !$user->is_active) {
                return null;
            }
            
            return $user;
        } catch (JWTException $e) {
            return null;
        }
    }
}
