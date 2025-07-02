<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Form</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <!-- SweetAlert2 CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.min.css">
    <!-- Login custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/login/styles.css') }}">
</head>

<body>
    <div class="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <div class="login-container animate__animated animate__fadeIn">
            <form id="loginForm" class="form-signin">
                <h1 class="h3 mb-4 fw-normal text-center">Sign in to your account</h1>

                <div class="form-floating">
                    <input type="text" class="form-control" id="username" name="username" placeholder="Username"
                        required>
                    <label for="username">Username</label>
                    <div class="invalid-feedback">Please enter your username.</div>
                </div>

                <div class="form-floating">
                    <input type="password" class="form-control" id="password" name="password" placeholder="Password"
                        required>
                    <label for="password">Password</label>
                    <div class="invalid-feedback">Please enter your password.</div>
                </div>

                <div class="form-check text-start my-3">
                    <input class="form-check-input" type="checkbox" value="remember-me" id="remember">
                    <label class="form-check-label" for="remember">
                        Remember me
                    </label>
                </div>

                <button class="btn btn-primary w-100 py-2" type="submit" id="loginButton">
                    Sign in
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                </button>

                <div class="text-center mt-3 mb-2">
                    <p class="forgot-password-message">Trouble signing in? <a href="/forgot-password"
                            class="forgot-password-link">Reset your password</a></p>
                </div>

                <div class="text-center mt-1">
                    <span>Doesn't have an account? <a href="/register-form" class="register-link">Register</a></span>
                </div>

                <p class="mt-4 mb-0 text-center copyright">&copy; 2025 PT Serasi Tunggal Mandiri. All rights reserved.
                </p>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.all.min.js"></script>
    <!-- Custom JS -->
    <script src="{{ asset('js/login/login.js') }}"></script>
</body>

</html>