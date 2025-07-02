<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    protected $jwtService;
    
    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function register(Request $request)
    {

        $messages = [
            'password.min' => 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
            'password.letters' => 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
            'password.mixed' => 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
            'password.numbers' => 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
            'password.symbols' => 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        ];

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => 'required|in:admin,staff,manager',
        ], $messages);

        $users = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($request->password),
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'users' => array_merge(['id' => $users->id], $users->toArray()),
        ], 201);
    }
    public function login (request $request) {
        $credentials = $request->only('username', 'password');
        
        $user = User::where('username', $credentials['username'])->first();
        
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'status' => 401,
                'message' => 'Invalid username or password',
            ], 401);
        }
        
        // Generate access dan refresh token
        $accessToken = $this->jwtService->generateAccessToken($user);
        $refreshToken = $this->jwtService->generateRefreshToken($user);
        
        // Simpan token ke database
        $this->jwtService->storeTokens($user, $accessToken, $refreshToken);
        
        // Update last login
        $user->update(['last_login' => now()]);
        
        // Hanya ambil data yang dibutuhkan untuk response
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role
        ];
        
        return response()->json([
            'status' => 200,
            'message' => 'Login successful',
            'data' => [
                'user' => $userData,
                'tokens' => [
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'expires_in' => JwtService::ACCESS_TOKEN_TTL * 60, // Dalam detik
                ]
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        // Dapatkan token dari header
        $token = $request->bearerToken();
        
        if ($token) {
            // Revoke token
            $this->jwtService->revokeToken($token);
        }
        
        return response()->json([
            'status' => 200,
            'message' => 'Logged out',
            'data' => null
        ], 200);
    }
}