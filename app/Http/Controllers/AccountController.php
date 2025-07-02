<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    /**
     * Display the account activity page.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function activity(Request $request)
    {
        // Validate the signed URL
        if (!$request->hasValidSignature()) {
            abort(401, 'The URL signature is invalid or has expired.');
        }
        
        // Get the user ID from the request
        $userId = $request->user;
        
        if (!$userId) {
            abort(400, 'User ID is required');
        }
        
        // Ensure the user exists
        $user = User::findOrFail($userId);
        
        // Get the user's recent activity (you can customize this based on your activity tracking implementation)
        $activities = []; // Replace with your actual activity data
        
        // Return the account activity view
        return view('account.activity', [
            'user' => $user,
            'activities' => $activities,
        ]);
    }
} 