<?php

namespace App\Http\Middleware;

use Closure;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtMiddleware
{
    protected $jwtService;
    
    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }
    
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $role
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $role = null)
    {
        // Ambil token dari header
        $token = $request->bearerToken();

        // Check if token is null before validation
        if (!$token) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized - No token provided',
                'data' => null
            ], 401);
        }

        // Validasi token
        $user = $this->jwtService->validateToken($token);

        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized - Invalid token',
                'data' => null
            ], 401);
        }
        
        // Cek role jika diperlukan
        if ($role && $user->role !== $role) {
            return response()->json([
                'status' => 403,
                'message' => 'Forbidden',
                'data' => null
            ], 403);
        }
        
        // Set user ke request
        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        
        return $next($request);
    }
}
