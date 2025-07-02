/**
 * Reset Password functionality
 */
document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const form = document.getElementById("reset-password-form");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const submitButton = document.getElementById("submit-button");
    const passwordError = document.getElementById("password-error");
    const confirmPasswordError = document.getElementById(
        "confirm-password-error"
    );
    const tryAgainButton = document.getElementById("try-again-button");
    const toggleNewPassword = document.getElementById("toggleNewPassword");
    const toggleConfirmPassword = document.getElementById(
        "toggleConfirmPassword"
    );
    const passwordStrength = document.getElementById("passwordStrength");
    const countdownEl = document.getElementById("countdown");
    const invalidTokenAlert = document.getElementById("invalid-token-alert");

    // Requirements
    const reqLength = document.getElementById("req-length");
    const reqUppercase = document.getElementById("req-uppercase");
    const reqLowercase = document.getElementById("req-lowercase");
    const reqNumber = document.getElementById("req-number");
    const reqSpecial = document.getElementById("req-special");

    // Form States
    const initialState = document.getElementById("form-initial");
    const loadingState = document.getElementById("form-loading");
    const successState = document.getElementById("form-success");
    const errorState = document.getElementById("form-error");
    const errorMessage = document.getElementById("error-message");

    const allStates = [initialState, loadingState, successState, errorState];

    // Extract token from URL
    function getTokenFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("token");
    }

    // Initialize the token field value
    const token = getTokenFromUrl();
    document.getElementById("resetToken").value = token;

    // Show invalid token alert if no token is present
    if (!token) {
        invalidTokenAlert.classList.remove("d-none");
    }

    // Toggle password visibility
    toggleNewPassword.addEventListener("click", function () {
        togglePasswordVisibility(newPasswordInput, this);
    });

    toggleConfirmPassword.addEventListener("click", function () {
        togglePasswordVisibility(confirmPasswordInput, this);
    });

    // Check password requirements
    newPasswordInput.addEventListener("input", checkPasswordStrength);

    function checkPasswordStrength() {
        const password = newPasswordInput.value;
        let strength = 0;

        // Reset requirements
        resetRequirements();

        // Check length
        if (password.length >= 8) {
            strength++;
            markRequirementMet(reqLength);
        }

        // Check uppercase
        if (/[A-Z]/.test(password)) {
            strength++;
            markRequirementMet(reqUppercase);
        }

        // Check lowercase
        if (/[a-z]/.test(password)) {
            strength++;
            markRequirementMet(reqLowercase);
        }

        // Check numbers
        if (/[0-9]/.test(password)) {
            strength++;
            markRequirementMet(reqNumber);
        }

        // Check special characters
        if (/[^A-Za-z0-9]/.test(password)) {
            strength++;
            markRequirementMet(reqSpecial);
        }

        // Update strength indicator
        passwordStrength.className = "password-strength";
        if (strength <= 2) {
            passwordStrength.classList.add("weak");
        } else if (strength <= 4) {
            passwordStrength.classList.add("medium");
        } else {
            passwordStrength.classList.add("strong");
        }

        // Check if passwords match
        if (confirmPasswordInput.value) {
            checkPasswordMatch();
        }
    }

    function resetRequirements() {
        const requirements = document.querySelectorAll(".requirement-item");
        requirements.forEach((req) => {
            req.classList.remove("requirement-met");
            const icon = req.querySelector(".requirement-icon");
            icon.classList.remove("bi-check-circle-fill");
            icon.classList.add("bi-circle");
        });
    }

    function markRequirementMet(requirement) {
        requirement.classList.add("requirement-met");
        const icon = requirement.querySelector(".requirement-icon");
        icon.classList.remove("bi-circle");
        icon.classList.add("bi-check-circle-fill");
    }

    // Check password match
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);

    function checkPasswordMatch() {
        if (newPasswordInput.value !== confirmPasswordInput.value) {
            confirmPasswordError.classList.add("show");
            confirmPasswordInput.classList.add("is-invalid");
            return false;
        } else {
            confirmPasswordError.classList.remove("show");
            confirmPasswordInput.classList.remove("is-invalid");
            return true;
        }
    }

    // Form submission
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Reset errors
        passwordError.classList.remove("show");
        confirmPasswordError.classList.remove("show");

        // Validate password requirements
        const password = newPasswordInput.value;
        const isValid =
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password);

        if (!isValid) {
            passwordError.classList.add("show");
            return;
        }

        // Validate password match
        if (!checkPasswordMatch()) {
            return;
        }

        // Get token
        const token = document.getElementById("resetToken").value;
        if (!token) {
            invalidTokenAlert.classList.remove("d-none");
            return;
        }

        // Show loading state
        changeState(loadingState, allStates);

        // Send API request
        fetch("/api/v1/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                Accept: "application/json",
            },
            body: JSON.stringify({
                token: token,
                password: password,
                password_confirmation: confirmPasswordInput.value,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((data) => {
                        throw new Error(
                            data.message || "Failed to reset password"
                        );
                    });
                }
                return response.json();
            })
            .then((data) => {
                // Show success state
                changeState(successState, allStates);

                // Start countdown
                startCountdown();
            })
            .catch((err) => {
                // Show error state
                errorMessage.textContent =
                    err.message ||
                    "We couldn't reset your password. Please try again.";
                changeState(errorState, allStates);
            });
    });

    // Try again button
    tryAgainButton.addEventListener("click", function () {
        changeState(initialState, allStates);
    });

    // Countdown timer
    function startCountdown() {
        let seconds = 5;
        const interval = setInterval(() => {
            seconds--;
            countdownEl.textContent = `Redirecting in ${seconds} seconds...`;
            if (seconds <= 0) {
                clearInterval(interval);
                window.location.href = "/login-form";
            }
        }, 1000);
    }
});
