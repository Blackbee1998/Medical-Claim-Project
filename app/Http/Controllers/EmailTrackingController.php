<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmailTrackingController extends Controller
{
    /**
     * Track email opens
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function trackOpen(Request $request)
    {
        // Get tracking parameters
        $emailType = $request->input('type', 'unknown');
        $emailId = $request->input('id', 'unknown');
        $timestamp = $request->input('t', time());
        
        // Log the open event
        Log::info('Email opened', [
            'type' => $emailType,
            'id' => $emailId,
            'timestamp' => $timestamp,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        // Return a 1x1 transparent GIF
        return response(base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'))
            ->header('Content-Type', 'image/gif')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
    
    /**
     * Track email link clicks
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function trackClick(Request $request)
    {
        // Validate request data
        $validated = $request->validate([
            'url' => 'required|string',
            'emailType' => 'required|string',
            'emailId' => 'required|string',
            'linkType' => 'required|string',
            'timestamp' => 'required|numeric'
        ]);
        
        // Log the click event
        Log::info('Email link clicked', [
            'url' => $validated['url'],
            'type' => $validated['emailType'],
            'id' => $validated['emailId'],
            'link_type' => $validated['linkType'],
            'timestamp' => $validated['timestamp'],
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        return response()->json(['success' => true]);
    }
} 