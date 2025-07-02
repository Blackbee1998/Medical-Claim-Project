@extends('layouts.email')

@section('title', 'Reset Your Password')

@section('header', 'Password Reset')

@section('logo')
<img src="{{ asset('images/logo.svg') }}" alt="PT Serasi Tunggal Mandiri" class="logo">
@endsection

@section('styles')
/* Reset Password Specific Styles */
.lead {
font-size: 17px;
font-weight: 500;
color: #374151;
margin-bottom: 25px;
}

.action-container {
text-align: center;
margin: 30px 0;
}

.btn {
display: inline-block;
background-color: #0d6efd;
color: white !important;
text-decoration: none;
padding: 12px 24px;
border-radius: 8px;
margin: 0;
font-weight: 500;
font-size: 16px;
box-shadow: 0 3px 5px rgba(13, 110, 253, 0.2);
transition: all 0.3s ease;
position: relative;
overflow: hidden;
}

.btn:hover {
background-color: #0b5ed7;
transform: translateY(-2px);
box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
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
border-left: 3px solid #9ca3af;
transition: border-color 0.3s ease;
}

.security-notice:hover {
border-left-color: #0d6efd;
}

.security-notice p {
margin: 0;
font-size: 14px;
color: #6b7280;
}

.url-container {
background-color: #f3f4f6;
border-radius: 8px;
padding: 15px;
margin: 20px 0;
word-break: break-all;
border: 1px solid #e5e7eb;
transition: all 0.3s ease;
}

.url-container:hover {
background-color: #eef2ff;
border-color: #c7d2fe;
}

.url-container a {
color: #2563eb;
text-decoration: none;
font-family: 'Courier New', monospace;
font-size: 14px;
transition: color 0.2s ease;
}

.url-container a:hover {
color: #1d4ed8;
text-decoration: underline;
}

.expiry-notice {
display: flex;
align-items: center;
justify-content: center;
margin: 25px 0 15px;
}

.expiry-notice .indicator {
width: 10px;
height: 10px;
background-color: #f59e0b;
border-radius: 50%;
margin-right: 8px;
display: inline-block;
animation: pulse 2s infinite;
}

@keyframes pulse {
0% {
opacity: 0.5;
transform: scale(0.95);
}
50% {
opacity: 1;
transform: scale(1.05);
}
100% {
opacity: 0.5;
transform: scale(0.95);
}
}

.expiry-text {
font-size: 15px;
color: #4b5563;
font-weight: 500;
}

.help-section {
background-color: #f9fafb;
border-radius: 8px;
padding: 20px;
margin-top: 30px;
transition: transform 0.3s ease;
}

.help-section:hover {
transform: translateY(-2px);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
}

.help-section h2 {
font-size: 16px;
color: #4b5563;
margin-top: 0;
margin-bottom: 15px;
font-weight: 600;
}

.help-section p {
margin: 0 0 10px;
color: #6b7280;
font-size: 14px;
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
color: #2563eb;
font-weight: bold;
}

.highlight {
color: #1d4ed8;
font-weight: 500;
transition: all 0.2s ease;
padding: 1px 4px;
border-radius: 3px;
}

.highlight:hover {
background-color: #dbeafe;
}

.help-link {
display: inline-flex;
align-items: center;
color: #2563eb;
text-decoration: none;
font-weight: 500;
transition: all 0.2s ease;
}

.help-link:hover {
color: #1d4ed8;
}

.help-link i {
margin-right: 4px;
font-size: 14px;
}

.text-center {
text-align: center;
}

.callout {
border-left: 3px solid #0d6efd;
padding-left: 10px;
font-style: italic;
margin: 15px 0;
color: #4b5563;
}
@endsection

@section('content')
<div data-email-type="{{ $emailType ?? 'password_reset' }}" data-email-id="{{ $emailId ?? '' }}">
    <p class="lead">Hello,</p>

    <p>You've requested to reset your password for your account at <strong>PT Serasi Tunggal Mandiri</strong>. No
        worries, it happens to the best of us!</p>

    <div class="callout">
        To protect your account's security, this password reset request will only be valid for a limited time.
    </div>

    <div class="action-container">
        <a href="{{ $resetUrl }}" class="btn" data-link-type="reset_button">Reset My Password</a>
    </div>

    <div class="expiry-notice">
        <span class="indicator"></span>
        <span class="expiry-text">This link expires in 60 minutes</span>
    </div>

    <div class="security-notice">
        <p>If you didn't request this password reset, you can safely ignore this email. Your account security is
            important to us, and your password will remain unchanged.</p>
    </div>

    <p>Alternatively, you can copy and paste the following URL into your browser:</p>

    <div class="url-container">
        <a href="{{ $resetUrl }}" data-link-type="reset_url">{{ $resetUrl }}</a>
    </div>

    <div class="help-section">
        <h2>What happens next?</h2>
        <p>After clicking the button above, you'll be able to:</p>
        <ol class="steps">
            <li>Create a <span class="highlight">new secure password</span> of your choice</li>
            <li>Access your account immediately with your new credentials</li>
            <li>Continue using all of our services without interruption</li>
        </ol>
        <p>If you need any assistance, please contact our support team at <a href="mailto:support@serasitm.com"
                class="help-link"><i class="bi bi-envelope"></i>support@serasitm.com</a></p>
    </div>
</div>
@endsection

@section('tracking_pixel')
<img src="{{ url('/api/v1/email-tracking/open') }}?type={{ urlencode($emailType ?? 'password_reset') }}&id={{ urlencode($emailId ?? '') }}&t={{ time() }}"
    alt="" width="1" height="1" style="display:none">
@endsection