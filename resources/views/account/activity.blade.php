@extends('layouts.app')

@section('title', 'Account Activity')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-10">
            <div class="card">
                <div class="card-header">
                    <h2 class="mb-0">Account Activity</h2>
                </div>
                <div class="card-body">
                    <div class="alert alert-success">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        Your password was recently changed. This page shows recent account activity to help you monitor your account security.
                    </div>
                    
                    <h3 class="mt-4 mb-3">Recent Security Events</h3>
                    @if($activities && count($activities) > 0)
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Date</th>
                                        <th>Device</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($activities as $activity)
                                        <tr>
                                            <td>{{ $activity->event ?? '' }}</td>
                                            <td>{{ $activity->created_at ?? '' }}</td>
                                            <td>{{ $activity->device ?? '' }}</td>
                                            <td>{{ $activity->location ?? '' }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @else
                        <div class="text-center py-4">
                            <div class="mb-3">
                                <i class="bi bi-shield-check" style="font-size: 3rem; color: #10b981;"></i>
                            </div>
                            <p class="text-muted">No recent security events found for your account.</p>
                            <p>We'll track important security events like password changes and login attempts here.</p>
                        </div>
                    @endif
                    
                    <h3 class="mt-4 mb-3">Security Recommendations</h3>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <h5 class="card-title"><i class="bi bi-shield-lock me-2 text-primary"></i>Enable Two-Factor Authentication</h5>
                                    <p class="card-text">Add an extra layer of security to your account by enabling two-factor authentication.</p>
                                    <a href="#" class="btn btn-sm btn-outline-primary">Enable 2FA</a>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <h5 class="card-title"><i class="bi bi-envelope-check me-2 text-primary"></i>Verify Your Email</h5>
                                    <p class="card-text">Ensure we can contact you about important security updates by verifying your email.</p>
                                    <a href="#" class="btn btn-sm btn-outline-primary">Verify Email</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-4">
                        <a href="/" class="btn btn-primary">Back to Home</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// If we have a JWT login system, we can check if the user is authenticated
document.addEventListener('DOMContentLoaded', function() {
    // Check if we need to redirect to login
    const token = localStorage.getItem('access_token');
    if (!token) {
        // Just display the information for this page without requiring login
        // This is needed for password reset confirmation emails to work properly
    }
});
</script>
@endsection 