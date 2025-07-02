@extends('layouts.email')

@section('title', 'Password Change Confirmation')

@section('header', 'Password Changed')

@section('logo')
<img src="{{ asset('images/logo.svg') }}" alt="PT Serasi Tunggal Mandiri" class="logo">
@endsection

@section('styles')
/* Password Changed Email Specific Styles */
.lead {
font-size: 17px;
font-weight: 500;
color: #374151;
margin-bottom: 25px;
}

.success-icon-container {
text-align: center;
margin: 20px 0 30px;
}

.success-icon {
width: 60px;
height: 60px;
border-radius: 50%;
background-color: #ecfdf5;
display: inline-flex;
align-items: center;
justify-content: center;
animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
0% {
transform: scale(0);
opacity: 0;
}
60% {
transform: scale(1.1);
}
100% {
transform: scale(1);
opacity: 1;
}
}

.success-icon svg {
width: 32px;
height: 32px;
color: #10b981;
animation: checkmark 0.5s ease-out 0.3s forwards;
opacity: 0;
stroke-dasharray: 36;
stroke-dashoffset: 36;
}

@keyframes checkmark {
from {
opacity: 1;
stroke-dashoffset: 36;
}
to {
opacity: 1;
stroke-dashoffset: 0;
}
}

.action-container {
text-align: center;
margin: 30px 0;
}

.btn {
display: inline-block;
background-color: #10b981;
color: white !important;
text-decoration: none;
padding: 12px 24px;
border-radius: 8px;
margin: 0;
font-weight: 500;
font-size: 16px;
box-shadow: 0 3px 5px rgba(16, 185, 129, 0.2);
transition: all 0.3s ease;
position: relative;
overflow: hidden;
}

.btn:hover {
background-color: #059669;
transform: translateY(-2px);
box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn::after {
content: '';
position: absolute;
top: 50%;
left: 50%;
width: 5px;
height: 5px;
background: rgba(255, 255, 255, 0.3);
opacity: 0;
border-radius: 100%;
transform: scale(1, 1) translate(-50%);
transform-origin: 50% 50%;
}

.btn:hover::after {
animation: ripple 1s ease-out;
}

@keyframes ripple {
0% {
transform: scale(0, 0);
opacity: 0.5;
}
20% {
transform: scale(25, 25);
opacity: 0.3;
}
100% {
opacity: 0;
transform: scale(40, 40);
}
}

.security-notice {
background-color: #f9fafb;
border-radius: 8px;
padding: 15px 20px;
margin: 25px 0;
border-left: 3px solid #10b981;
transition: background-color 0.3s ease;
}

.security-notice:hover {
background-color: #ecfdf5;
}

.security-notice p {
margin: 0;
font-size: 14px;
color: #6b7280;
}

.security-notice strong {
color: #10b981;
}

.info-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 15px;
margin: 25px 0;
}

.info-item {
background-color: #f9fafb;
border-radius: 8px;
padding: 15px;
transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.info-item:hover {
transform: translateY(-2px);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.info-item h3 {
margin: 0 0 8px;
font-size: 14px;
color: #6b7280;
font-weight: 500;
}

.info-item p {
margin: 0;
font-size: 15px;
color: #374151;
font-weight: 500;
}

.steps-section {
background-color: #f9fafb;
border-radius: 8px;
padding: 20px;
margin-top: 30px;
transition: transform 0.3s ease;
}

.steps-section:hover {
transform: translateY(-2px);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
}

.steps-section h2 {
font-size: 16px;
color: #4b5563;
margin-top: 0;
margin-bottom: 15px;
font-weight: 600;
}

.steps {
padding-left: 20px;
margin: 15px 0;
}

.steps li {
margin-bottom: 12px;
color: #6b7280;
position: relative;
padding-left: 5px;
}

.steps li::marker {
color: #10b981;
font-weight: bold;
}

.help-link {
display: inline-flex;
align-items: center;
color: #10b981;
text-decoration: none;
font-weight: 500;
transition: all 0.2s ease;
}

.help-link:hover {
color: #059669;
}

@media (max-width: 576px) {
.info-grid {
grid-template-columns: 1fr;
}
}
@endsection

@section('content')
<div data-email-type="{{ $emailType ?? 'password_changed' }}" data-email-id="{{ $emailId ?? '' }}">
    <div class="success-icon-container">
        <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
    </div>

    <p class="lead">Hello {{ $user->name ?? 'there' }},</p>

    <p>Your password has been <strong style="color: #10b981;">successfully changed</strong>. This email confirms that you've updated your account password at <strong>PT Serasi Tunggal Mandiri</strong>.</p>

    <div class="info-grid">
        <div class="info-item">
            <h3>Time of Change</h3>
            <p>{{ $change_time ?? now()->format('M d, Y - h:i A') }}</p>
        </div>
        <div class="info-item">
            <h3>Device</h3>
            <p>{{ $device ?? 'Unknown device' }}</p>
        </div>
    </div>

    <div class="security-notice">
        <p><strong>Didn't change your password?</strong> If you didn't make this change, please secure your account immediately by resetting your password and contacting our support team.</p>
    </div>

    <div class="action-container">
        <a href="{{ $account_activity_url ?? route('account.activity') }}" class="btn review-activity-btn" data-link-type="review_activity">Review Account Activity</a>
    </div>

    <div class="steps-section">
        <h2>Keeping Your Account Secure</h2>
        <ol class="steps">
            <li>Use a strong, unique password that you don't use elsewhere</li>
            <li>Enable two-factor authentication for extra security</li>
            <li>Regularly check your account for any suspicious activity</li>
            <li>Never share your password or account details with anyone</li>
        </ol>
    </div>

    <p>Remember, our team will never ask for your password. If you have any questions or concerns about your account security, please don't hesitate to contact our support team.</p>

    <p>Thank you for helping us keep your account secure.</p>
</div>
@endsection

@section('tracking_pixel')
<img src="{{ url('/api/v1/email-tracking/open') }}?type={{ urlencode($emailType ?? 'password_changed') }}&id={{ urlencode($emailId ?? '') }}&t={{ time() }}" 
     alt="" width="1" height="1" style="display:none">
@endsection 