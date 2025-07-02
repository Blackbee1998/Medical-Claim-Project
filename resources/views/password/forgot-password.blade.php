<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Forgot Your Password</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="{{ asset('css/password/password-common.css') }}">
    <link rel="stylesheet" href="{{ asset('css/password/forgot-password.css') }}">
</head>

<body>
    <div class="auth-container forgot-container">
        <!-- Initial Form State -->
        <div class="form-state active" id="form-initial">
            <div class="text-center">
                <i class="bi bi-key header-icon"></i>
                <h1 class="form-title">Forgot Your Password?</h1>
                <p class="form-instructions">Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <form id="forgot-password-form" novalidate>
                <!-- Email Input -->
                <div class="form-floating">
                    <input type="email" class="form-control" id="emailInput"
                        placeholder="Enter your registered email address" required>
                    <label for="emailInput">Email Address</label>
                    <div class="error-message" id="email-error">Please enter a valid email address.</div>
                </div>

                <!-- Instructions -->
                <p class="form-text">
                    We'll send a password reset link to your email. Please check your inbox and spam folder.
                </p>

                <!-- Submit Button -->
                <button class="btn btn-primary w-100" type="submit" id="submit-button">
                    <span class="btn-text">Send Reset Link</span>
                    <i class="bi bi-envelope-fill btn-icon"></i>
                </button>
            </form>

            <!-- Back to login page -->
            <div class="text-center mt-4">
                <span>Remember your password? <a href="/login-form" class="login-link">Back to Login</a></span>
            </div>
        </div>

        <!-- Loading State -->
        <div class="form-state" id="form-loading">
            <div class="text-center">
                <div class="spinner-border text-primary mb-4" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h2 class="form-title">Processing Your Request</h2>
                <p class="form-instructions">Please wait while we send you a password reset link...</p>
            </div>
        </div>

        <!-- Success State -->
        <div class="form-state" id="form-success">
            <div class="text-center">
                <svg class="success-checkmark" viewBox="0 0 52 52">
                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
                <h2 class="form-title">Check Your Email</h2>
                <p class="form-instructions">We've sent a password reset link to <span id="masked-email">your
                        email</span>.</p>
                <p class="form-text">The link will expire in 60 minutes. If you don't see the email, check your spam
                    folder.</p>
                <a href="/login-form" class="btn btn-primary w-100">
                    <span class="btn-text">Return to Login</span>
                </a>
            </div>
        </div>

        <!-- Error State -->
        <div class="form-state" id="form-error">
            <div class="text-center">
                <i class="bi bi-exclamation-circle text-danger header-icon"></i>
                <h2 class="form-title">Oops! Something went wrong</h2>
                <p class="form-instructions" id="error-message">We couldn't find an account with that email address.</p>
                <button class="btn btn-primary w-100 mt-3" id="try-again-button">
                    <span class="btn-text">Try Again</span>
                </button>
            </div>
        </div>

        <!-- Footer -->
        <p class="copyright">&copy; {{ date('Y') }} PT Serasi Tunggal Mandiri. All rights reserved.</p>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="{{ asset('js/password/password-utils.js') }}"></script>
    <script src="{{ asset('js/password/forgot-password.js') }}"></script>
</body>

</html>