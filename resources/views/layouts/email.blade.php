<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Email Notification')</title>
    <style>
        /* Base Email Styles */
        body {
            font-family: 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px 20px;
            background-color: #f3f4f6;
        }

        .email-wrapper {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
            background-color: #fff;
        }

        .header {
            text-align: center;
            padding: 35px 25px 25px;
            background: linear-gradient(135deg, #0d6efd, #1a56db);
        }

        .header h1 {
            color: #fff;
            font-weight: 500;
            margin: 0;
            font-size: 28px;
            letter-spacing: -0.5px;
        }

        .header .logo {
            margin-bottom: 20px;
            max-width: 180px;
            height: auto;
        }

        .content {
            background-color: #fff;
            padding: 35px 30px;
            border-bottom: 1px solid #e5e7eb;
        }

        .content p {
            margin: 0 0 20px;
            color: #4b5563;
        }

        .footer {
            font-size: 13px;
            color: #9ca3af;
            text-align: center;
            padding: 25px;
            background-color: #f9fafb;
        }

        .footer p {
            margin: 0 0 5px;
        }

        .social-links {
            margin: 20px 0 15px;
        }

        .social-link {
            display: inline-block;
            margin: 0 8px;
            color: #6b7280;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        /* Additional styles can be included in specific templates */
        @yield('styles')
    </style>
    
    {{-- Note: JavaScript is included but many email clients will not execute it --}}
    @if(config('app.env') === 'local')
    {{-- In development, use script references --}}
    <script src="{{ asset('js/password/email/email-utils.js') }}"></script>
    <script src="{{ asset('js/password/email/email-tracking.js') }}"></script>
    @endif
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            @yield('logo')
            <h1>@yield('header', 'Notification')</h1>
        </div>
        
        <div class="content">
            @yield('content')
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} PT Serasi Tunggal Mandiri. All rights reserved.</p>
            
            <div class="social-links">
                <a href="#" class="social-link">Help</a>
                <a href="#" class="social-link">Privacy</a>
                <a href="#" class="social-link">Terms</a>
            </div>
            
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
    
    {{-- Tracking pixel, only shown if JS doesn't execute --}}
    @yield('tracking_pixel')
</body>
</html> 