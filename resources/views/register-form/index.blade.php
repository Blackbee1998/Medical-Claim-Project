<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <!-- SweetAlert2 CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/register/styles.css') }}">
</head>

<body>
    <div class="register-container">
        <div class="register-header">
            <h1 class="text-center mb-3">Create Your Account</h1>
            <p class="text-center text-muted mb-4">Join us and start your journey. It only takes 2 minutes!</p>

            <div class="step-indicator">
                <div class="step active" id="step-indicator-1">1</div>
                <div class="step" id="step-indicator-2">2</div>
                <div class="step" id="step-indicator-3">3</div>
                <div class="step-progress" id="step-progress"></div>
            </div>
        </div>

        <form class="register-form needs-validation" id="registerForm" novalidate>
            <div class="alert alert-danger" id="errorAlert" role="alert"></div>
            <div class="alert alert-success" id="successAlert" role="alert"></div>

            <!-- Step 1: Personal Information -->
            <div class="step-content active" id="step-1">
                <h5 class="step-title">Personal Information</h5>

                <div class="form-group">
                    <label for="fullname" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="fullname" name="name" required>
                    <div class="invalid-feedback">Please enter your full name.</div>
                </div>

                <div class="form-group">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                    <div class="invalid-feedback">Please choose a username.</div>
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                    <div class="invalid-feedback">Please enter a valid email address.</div>
                </div>

                <div class="step-buttons">
                    <div></div> <!-- Empty div for flex spacing -->
                    <button type="button" class="btn btn-primary" id="next-1">Continue</button>
                </div>
            </div>

            <!-- Step 2: Security Information -->
            <div class="step-content" id="step-2">
                <h5 class="step-title">Security Information</h5>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                    <div class="password-strength"></div>
                    <div class="form-text">Password must be at least 8 characters long and include uppercase, lowercase,
                        numbers, and special characters.</div>
                </div>

                <div class="form-group">
                    <label for="confirmPassword" class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" id="confirmPassword" name="password_confirmation"
                        required>
                    <div class="invalid-feedback">Passwords do not match.</div>
                </div>

                <div class="step-buttons">
                    <button type="button" class="btn btn-secondary" id="prev-2">Back</button>
                    <button type="button" class="btn btn-primary" id="next-2">Continue</button>
                </div>
            </div>

            <!-- Step 3: Role Selection & Review -->
            <div class="step-content" id="step-3">
                <h5 class="step-title">Role & Review</h5>

                <div class="form-group">
                    <label for="role" class="form-label">Select Your Role</label>
                    <select class="form-select" id="role" name="role" required>
                        <option value="" selected disabled>Choose your role</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                    </select>
                    <div class="invalid-feedback">Please select a role.</div>
                </div>

                <h6 class="mb-3 mt-4">Information Summary</h6>
                <div class="summary-section">
                    <div class="summary-item">
                        <span class="summary-label">Full Name:</span>
                        <span class="summary-value" id="summary-fullname">-</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Username:</span>
                        <span class="summary-value" id="summary-username">-</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Email:</span>
                        <span class="summary-value" id="summary-email">-</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Role:</span>
                        <span class="summary-value" id="summary-role">-</span>
                    </div>
                </div>

                <div class="step-buttons">
                    <button type="button" class="btn btn-secondary" id="prev-3">Back</button>
                    <button type="submit" class="btn btn-primary" id="submit-form">
                        Create Account
                        <span class="loading-spinner"></span>
                    </button>
                </div>
            </div>

            <div class="text-center mt-4">
                <span>Already have an account? <a href="/login-form" class="login-link">Login</a></span>
            </div>

            <p class="copyright">&copy; 2025 PT Serasi Tunggal Mandiri. All rights reserved.</p>
        </form>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.all.min.js"></script>

    <!-- Custom JS -->
    <script src="{{ asset('js/register/form.js') }}"></script>
</body>

</html>