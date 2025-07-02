<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\PasswordReset;
use App\Mail\ResetPasswordMail;
use App\Mail\PasswordChangedMail;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class PasswordResetController extends Controller
{
     /**
     * Request untuk reset password (forgot password)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPassword(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        // Jika validasi gagal
        if ($validator->fails()) {
            return response()->json([
                'message' => 'validation error',
                'errors' => $validator->errors()
            ], 400);
        }

        // Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User dengan email tersebut tidak ditemukan'
            ], 404);
        }
        
        // Tandai token lama yang belum digunakan sebagai sudah dipakai
        PasswordReset::where('user_id', $user->id)
            ->where('is_used', false)
            ->update(['is_used' => true]);
        
        // Buat token JWT
        $customClaims = [
            'user_id' => $user->id,
            'email' => $user->email,
            'purpose' => 'password_reset'
        ];
        $token = JWTAuth::customClaims($customClaims)->fromUser($user);
        $shortToken = Str::random(10) . bin2hex(random_bytes(5)); // Token yang lebih pendek untuk tampilan di email

        // Simpan token ke database dengan expiry time 60 menit
        $passwordReset = PasswordReset::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => Carbon::now()->addMinutes(60),
            'is_used' => false
        ]);

        // Kirim email dengan token
        try {
            Mail::to($user->email)->send(new ResetPasswordMail($shortToken, $token));
            
            return response()->json([
                'message' => 'Password reset instructions sent to email'
            ], 200);
        } catch (\Exception $e) {
            // Jika pengiriman email gagal, tandai token sebagai sudah digunakan
            $passwordReset->update(['is_used' => true]);
            
            return response()->json([
                'message' => 'Failed send password reset instuctions to email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset password dengan token yang dikirim via email
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ]);

        // Jika validasi gagal
        if ($validator->fails()) {
            return response()->json([
                'message' => 'validation error',
                'errors' => $validator->errors()
            ], 400);
        }

        // Cari token di database
        $passwordReset = PasswordReset::where('token', $request->token)
            ->where('is_used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$passwordReset) {
            return response()->json([
                'message' => 'Invalid or expired token'
            ], 400);
        }

        // Cari user berdasarkan token
        $user = User::find($passwordReset->user_id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        // Update password user
        $user->password = Hash::make($request->password);
        $user->save();

        // Tandai token sebagai sudah digunakan
        $passwordReset->is_used = true;
        $passwordReset->save();

        // Send password change confirmation email
        try {
            $mailData = [
                'user_agent' => $request->header('User-Agent'),
                'change_time' => now()->format('M d, Y - h:i A'),
                'email_id' => Str::uuid()
            ];
            
            Mail::to($user->email)->send(new PasswordChangedMail($user, $mailData));
        } catch (\Exception $e) {
            // Log the error but don't fail the password reset
            logger('Failed to send password change confirmation email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Password reset successfully'
        ], 200);
    }
}
