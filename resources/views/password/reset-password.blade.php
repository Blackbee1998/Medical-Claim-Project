<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Reset Password</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="{{ asset('css/password/password-common.css') }}">
    <link rel="stylesheet" href="{{ asset('css/password/reset-password.css') }}">
</head>

<body>
    <div class="auth-container reset-container">
        <!-- Initial Form State -->
        <div class="form-state active" id="form-initial">
            <div class="text-center">
                <i class="bi bi-shield-lock header-icon"></i>
                <h1 class="form-title">Reset Your Password</h1>
                <p class="form-instructions">Create a new password for your account</p>

                <div class="session-info">
                    <i class="bi bi-info-circle"></i>
                    <span>This reset link is valid for <strong>60 minutes</strong></span>
                </div>
            </div>

            <!-- Alert for errors (invalid/expired token) -->
            <div class="alert alert-danger d-none invalid-token-message" id="invalid-token-alert">
                <i class="bi bi-exclamation-circle me-2"></i>
                This password reset link is invalid or has expired. Please request a new password reset link.
            </div>

            <form id="reset-password-form" novalidate>
                <!-- Hidden token field -->
                <input type="hidden" id="resetToken" value="">

                <!-- New Password Field -->
                <div class="form-group">
                    <label for="newPassword" class="form-label">New Password</label>
                    <div class="position-relative">
                        <input type="password" class="form-control" id="newPassword" required>
                        <i class="bi bi-eye-slash password-toggle" id="toggleNewPassword"></i>
                    </div>
                    <div class="password-strength" id="passwordStrength"></div>
                    <div class="error-message" id="password-error">Please enter a valid password.</div>
                </div>

                <!-- Confirm Password Field -->
                <div class="form-group">
                    <label for="confirmPassword" class="form-label">Confirm Password</label>
                    <div class="position-relative">
                        <input type="password" class="form-control" id="confirmPassword" required>
                        <i class="bi bi-eye-slash password-toggle" id="toggleConfirmPassword"></i>
                    </div>
                    <div class="error-message" id="confirm-password-error">Passwords do not match.</div>
                </div>

                <!-- Password Requirements -->
                <div class="requirements">
                    <div class="requirement-item" id="req-length">
                        <i class="bi bi-circle requirement-icon"></i>
                        At least 8 characters
                    </div>
                    <div class="requirement-item" id="req-uppercase">
                        <i class="bi bi-circle requirement-icon"></i>
                        At least one uppercase letter
                    </div>
                    <div class="requirement-item" id="req-lowercase">
                        <i class="bi bi-circle requirement-icon"></i>
                        At least one lowercase letter
                    </div>
                    <div class="requirement-item" id="req-number">
                        <i class="bi bi-circle requirement-icon"></i>
                        At least one number
                    </div>
                    <div class="requirement-item" id="req-special">
                        <i class="bi bi-circle requirement-icon"></i>
                        At least one special character
                    </div>
                </div>

                <!-- Submit Button -->
                <button class="btn btn-primary w-100" type="submit" id="submit-button">
                    <span class="btn-text">Reset Password</span>
                    <i class="bi bi-shield-lock-fill btn-icon"></i>
                </button>
            </form>
        </div>

        <!-- Loading State -->
        <div class="form-state" id="form-loading">
            <div class="text-center">
                <div class="spinner-border text-primary mb-4" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h2 class="form-title">Processing Your Request</h2>
                <p class="form-instructions">Please wait while we update your password...</p>
            </div>
        </div>

        <!-- Success State -->
        <div class="form-state" id="form-success">
            <div class="text-center">
                <svg class="success-checkmark" viewBox="0 0 52 52">
                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
                <h2 class="form-title">Password Reset Successful!</h2>
                <p class="form-instructions">Your password has been reset successfully.</p>
                <p class="timer">You can now login with your new password. <span id="countdown">Redirecting in 5
                        seconds...</span></p>
                <a href="/login-form" class="btn btn-primary w-100 mt-3">
                    <span class="btn-text">Go to Login</span>
                    <i class="bi bi-box-arrow-in-right btn-icon"></i>
                </a>
            </div>
        </div>

        <!-- Error State -->
        <div class="form-state" id="form-error">
            <div class="text-center">
                <i class="bi bi-exclamation-circle text-danger header-icon"></i>
                <h2 class="form-title">Oops! Something went wrong</h2>
                <p class="form-instructions" id="error-message">We couldn't reset your password. Please try again.</p>
                <button class="btn btn-primary w-100 mt-3" id="try-again-button">
                    <span class="btn-text">Try Again</span>
                </button>
                <div class="text-center mt-3">
                    <a href="/password/forgot-password" class="login-link">Request a new reset link</a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <p class="copyright">&copy; {{ date('Y') }} PT Serasi Tunggal Mandiri. All rights reserved.</p>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="{{ asset('js/password/password-utils.js') }}"></script>
    <script src="{{ asset('js/password/reset-password.js') }}"></script>
</body>

</html>