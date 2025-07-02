/**
 * Registration Form JavaScript
 *
 * This file contains all the JavaScript functionality for the multi-step registration form.
 * It handles form validation, step navigation, API interaction, and SweetAlert2 integration.
 *
 * @module RegisterForm
 */

(function () {
    "use strict";

    // DOM Elements
    const form = document.getElementById("registerForm");
    const steps = document.querySelectorAll(".step-content");
    const stepIndicators = document.querySelectorAll(".step");
    const stepProgress = document.getElementById("step-progress");
    const nextButtons = document.querySelectorAll('[id^="next-"]');
    const prevButtons = document.querySelectorAll('[id^="prev-"]');
    const submitButton = document.getElementById("submit-form");
    const errorAlert = document.getElementById("errorAlert");
    const successAlert = document.getElementById("successAlert");

    // Form Fields
    const fullnameInput = document.getElementById("fullname");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const roleSelect = document.getElementById("role");

    // Summary Elements
    const summaryFullname = document.getElementById("summary-fullname");
    const summaryUsername = document.getElementById("summary-username");
    const summaryEmail = document.getElementById("summary-email");
    const summaryRole = document.getElementById("summary-role");

    // Password Strength Indicator
    const strengthBar = document.querySelector(".password-strength");

    // Current Step Tracking
    let currentStep = 1;
    const totalSteps = steps.length;

    /**
     * Initialize the registration form
     */
    function init() {
        // Initialize progress bar
        updateProgress();

        // Set up event listeners
        setupEventListeners();
    }

    /**
     * Set up all event listeners for the form
     */
    function setupEventListeners() {
        // Password strength measurement
        passwordInput.addEventListener("input", checkPasswordStrength);

        // Step navigation
        nextButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const stepNum = parseInt(button.id.split("-")[1]);
                if (validateStep(stepNum)) {
                    goToStep(stepNum + 1);
                    updateSummary();
                }
            });
        });

        prevButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const stepNum = parseInt(button.id.split("-")[1]);
                goToStep(stepNum - 1);
            });
        });

        // Form submission
        form.addEventListener("submit", handleFormSubmit);

        // Role select update summary
        roleSelect.addEventListener("change", updateSummary);

        // Reset invalid state when input changes
        const formInputs = form.querySelectorAll("input, select");
        formInputs.forEach((input) => {
            input.addEventListener("input", function () {
                this.classList.remove("is-invalid");
            });
        });
    }

    /**
     * Navigate to a specific step in the form
     * @param {number} step - The step number to navigate to
     */
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        // Hide any previous alerts
        errorAlert.style.display = "none";
        successAlert.style.display = "none";

        // Hide all steps
        steps.forEach((s) => s.classList.remove("active"));

        // Show current step
        document.getElementById(`step-${step}`).classList.add("active");

        // Update indicators
        stepIndicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove("active", "completed");

            if (stepNum < step) {
                indicator.classList.add("completed");
                indicator.innerHTML = '<i class="bi bi-check"></i>';
            } else if (stepNum === step) {
                indicator.classList.add("active");
                indicator.textContent = stepNum;
            } else {
                indicator.textContent = stepNum;
            }
        });

        currentStep = step;
        updateProgress();
    }

    /**
     * Update the progress bar based on current step
     */
    function updateProgress() {
        const progressPercentage =
            totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 100;
        stepProgress.style.width = `${progressPercentage}%`;
    }

    /**
     * Check and visualize password strength
     */
    function checkPasswordStrength() {
        const password = this.value;
        let strength = 0;

        // Check password length
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Check character types
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++; // Special characters

        // Apply the appropriate class based on strength
        strengthBar.className = "password-strength";
        if (strength <= 2) {
            strengthBar.classList.add("weak");
        } else if (strength <= 4) {
            strengthBar.classList.add("medium");
        } else {
            strengthBar.classList.add("strong");
        }
    }

    /**
     * Validate a specific step in the form
     * @param {number} step - The step number to validate
     * @returns {boolean} - Whether the step is valid
     */
    function validateStep(step) {
        let isValid = true;

        // Reset validation
        form.classList.remove("was-validated");

        if (step === 1) {
            // Full name validation
            if (!fullnameInput.value.trim()) {
                fullnameInput.classList.add("is-invalid");
                isValid = false;
            } else if (fullnameInput.value.trim().length < 2) {
                fullnameInput.classList.add("is-invalid");
                fullnameInput.nextElementSibling.textContent =
                    "Name must be at least 2 characters long.";
                isValid = false;
            } else {
                fullnameInput.classList.remove("is-invalid");
                fullnameInput.classList.add("is-valid");
            }

            // Username validation - at least 3 characters and alphanumeric
            if (!usernameInput.value.trim()) {
                usernameInput.classList.add("is-invalid");
                isValid = false;
            } else if (usernameInput.value.trim().length < 3) {
                usernameInput.classList.add("is-invalid");
                usernameInput.nextElementSibling.textContent =
                    "Username must be at least 3 characters long.";
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(usernameInput.value.trim())) {
                usernameInput.classList.add("is-invalid");
                usernameInput.nextElementSibling.textContent =
                    "Username can only contain letters, numbers, and underscores.";
                isValid = false;
            } else {
                usernameInput.classList.remove("is-invalid");
                usernameInput.classList.add("is-valid");
            }

            // Email validation - must be valid email format
            if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                emailInput.classList.add("is-invalid");
                emailInput.nextElementSibling.textContent =
                    "Please enter a valid email address.";
                isValid = false;
            } else {
                emailInput.classList.remove("is-invalid");
                emailInput.classList.add("is-valid");
            }
        } else if (step === 2) {
            // Password validation
            const password = passwordInput.value;
            const hasLowerCase = /[a-z]/.test(password);
            const hasUpperCase = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[^a-zA-Z0-9]/.test(password);
            const isLongEnough = password.length >= 8;

            if (
                !password ||
                !isLongEnough ||
                !hasLowerCase ||
                !hasUpperCase ||
                !hasNumber ||
                !hasSpecial
            ) {
                passwordInput.classList.add("is-invalid");
                let errorMsg =
                    "Password must be at least 8 characters and include: ";
                let missingReqs = [];
                if (!isLongEnough) missingReqs.push("8+ characters");
                if (!hasLowerCase) missingReqs.push("lowercase letter");
                if (!hasUpperCase) missingReqs.push("uppercase letter");
                if (!hasNumber) missingReqs.push("number");
                if (!hasSpecial) missingReqs.push("special character");

                passwordInput.nextElementSibling.nextElementSibling.textContent =
                    errorMsg + missingReqs.join(", ");
                isValid = false;
            } else {
                passwordInput.classList.remove("is-invalid");
                passwordInput.classList.add("is-valid");
            }

            // Confirm password validation
            if (
                !confirmPasswordInput.value ||
                confirmPasswordInput.value !== passwordInput.value
            ) {
                confirmPasswordInput.classList.add("is-invalid");
                confirmPasswordInput.nextElementSibling.textContent =
                    "Passwords do not match.";
                isValid = false;
            } else {
                confirmPasswordInput.classList.remove("is-invalid");
                confirmPasswordInput.classList.add("is-valid");
            }
        } else if (step === 3) {
            // Role validation
            if (!roleSelect.value) {
                roleSelect.classList.add("is-invalid");
                isValid = false;
            } else {
                roleSelect.classList.remove("is-invalid");
                roleSelect.classList.add("is-valid");
            }
        }

        if (!isValid) {
            form.classList.add("was-validated");
        }

        return isValid;
    }

    /**
     * Validate the entire form
     * @returns {boolean} - Whether the form is valid
     */
    function validateForm() {
        return validateStep(1) && validateStep(2) && validateStep(3);
    }

    /**
     * Check if an email is valid
     * @param {string} email - The email to validate
     * @returns {boolean} - Whether the email is valid
     */
    function isValidEmail(email) {
        const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    /**
     * Update the summary section with current values
     */
    function updateSummary() {
        summaryFullname.textContent = fullnameInput.value || "-";
        summaryUsername.textContent = usernameInput.value || "-";
        summaryEmail.textContent = emailInput.value || "-";

        if (roleSelect.value) {
            const selectedOption = roleSelect.options[roleSelect.selectedIndex];
            summaryRole.textContent = selectedOption.text;
        } else {
            summaryRole.textContent = "-";
        }
    }

    /**
     * Reset the form to its initial state
     */
    function resetForm() {
        // Reset all form fields
        form.reset();

        // Clear all validation states
        const formElements = form.querySelectorAll("input, select");
        formElements.forEach((element) => {
            element.classList.remove("is-invalid", "is-valid");
        });

        // Reset password strength
        strengthBar.className = "password-strength";

        // Go back to first step
        goToStep(1);

        // Reset summary
        summaryFullname.textContent = "-";
        summaryUsername.textContent = "-";
        summaryEmail.textContent = "-";
        summaryRole.textContent = "-";
    }

    /**
     * Handle form submission
     * @param {Event} event - The submit event
     */
    async function handleFormSubmit(event) {
        event.preventDefault();

        // Hide any previous alerts
        errorAlert.style.display = "none";
        successAlert.style.display = "none";

        if (validateForm()) {
            // Set button to loading state
            submitButton.classList.add("btn-loading");
            submitButton.disabled = true;

            try {
                // Collect form data
                const formData = {
                    name: fullnameInput.value,
                    username: usernameInput.value,
                    email: emailInput.value,
                    password: passwordInput.value,
                    password_confirmation: confirmPasswordInput.value,
                    role: roleSelect.value,
                };

                // Get the CSRF token
                const csrfToken = document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content");
                if (!csrfToken) {
                    throw new Error("CSRF token not found");
                }

                // Send the request to the API endpoint
                await submitRegistration(formData, csrfToken);
            } catch (error) {
                // Handle network or other errors
                console.error("Registration error:", error);

                // Show error message with SweetAlert2
                showError(
                    "Connection Error",
                    error.message ||
                        "A network error occurred. Please try again later."
                );
            } finally {
                // Reset button state
                submitButton.classList.remove("btn-loading");
                submitButton.disabled = false;
            }
        }
    }

    // SweetAlert helper functions
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    /**
     * Display a success notification and redirect
     * @param {string} title - The title of the notification
     * @param {string} message - The message to display
     * @param {string} redirectUrl - The URL to redirect to after the timer
     * @param {number} timer - Time in milliseconds before redirect
     */
    function showSuccessWithRedirect(
        title,
        message,
        redirectUrl,
        timer = 2500
    ) {
        Swal.fire({
            title: title,
            text: message,
            icon: "success",
            timer: timer,
            timerProgressBar: true,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
            willClose: () => {
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            },
        });
    }

    /**
     * Display an error notification
     * @param {string} title - The title of the notification
     * @param {string} message - The message to display (can be HTML)
     * @param {boolean} isHtml - Whether the message contains HTML
     */
    function showError(title, message, isHtml = false) {
        Swal.fire({
            title: title,
            [isHtml ? "html" : "text"]: message,
            icon: "error",
            confirmButtonText: "Try Again",
            confirmButtonColor: "#0d6efd",
        });
    }

    /**
     * Submit registration data to the API
     * @param {Object} formData - The registration form data
     * @param {string} csrfToken - The CSRF token
     * @returns {Promise<void>}
     */
    async function submitRegistration(formData, csrfToken) {
        try {
            const response = await fetch("/api/v1/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                    Accept: "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            // Handle response based on status
            if (response.ok) {
                // Reset form after successful submission
                resetForm();

                // Show success message with SweetAlert2
                showSuccessWithRedirect(
                    "Registration Successful!",
                    "Your account has been created successfully. You will be redirected to the login page.",
                    "/login-form"
                );
            } else {
                // Handle error response
                handleErrorResponse(data);
            }
        } catch (error) {
            // Re-throw error to be caught by the outer try-catch
            throw error;
        }
    }

    /**
     * Handle error responses from the API
     * @param {Object} data - The error response data
     */
    function handleErrorResponse(data) {
        let errorMessage = "Registration failed. Please try again.";

        // Handle different types of error responses
        if (data.errors && typeof data.errors === "object") {
            // Laravel validation errors usually come as an object with field names as keys
            const errorMessages = Object.values(data.errors).flat();
            errorMessage = errorMessages.join("<br>");
        } else if (data.message) {
            // Single error message
            errorMessage = data.message;
        } else if (Array.isArray(data.errors)) {
            // Some APIs return array of error messages
            errorMessage = data.errors.join("<br>");
        }

        // Show error message with SweetAlert2
        showError("Registration Failed", errorMessage, true);

        // Highlight fields with errors if they are returned
        highlightInvalidFields(data.errors);
    }

    /**
     * Highlight form fields with validation errors
     * @param {Object} errors - The validation errors object
     */
    function highlightInvalidFields(errors) {
        if (!errors) return;

        for (const field in errors) {
            const inputField = document.querySelector(`[name="${field}"]`);
            if (inputField) {
                inputField.classList.add("is-invalid");
                // If there's a specific feedback element for this field, update it
                const feedback = inputField.nextElementSibling;
                if (
                    feedback &&
                    feedback.classList.contains("invalid-feedback")
                ) {
                    feedback.textContent = errors[field][0];
                }
            }
        }
    }

    // Initialize the form when the DOM is fully loaded
    document.addEventListener("DOMContentLoaded", init);
})();
