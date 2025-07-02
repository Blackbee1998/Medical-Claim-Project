/**
 * Forgot Password functionality
 */
document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const form = document.getElementById("forgot-password-form");
    const emailInput = document.getElementById("emailInput");
    const submitButton = document.getElementById("submit-button");
    const emailError = document.getElementById("email-error");
    const maskedEmail = document.getElementById("masked-email");
    const tryAgainButton = document.getElementById("try-again-button");
    const errorMessage = document.getElementById("error-message");

    // Form States
    const initialState = document.getElementById("form-initial");
    const loadingState = document.getElementById("form-loading");
    const successState = document.getElementById("form-success");
    const errorState = document.getElementById("form-error");

    const allStates = [initialState, loadingState, successState, errorState];

    // Form submission
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Reset error state
        emailError.classList.remove("show");

        // Validate email
        const email = emailInput.value.trim();
        if (!email || !isValidEmail(email)) {
            emailError.classList.add("show");
            emailInput.focus();
            return;
        }

        // Show loading state
        changeState(loadingState, allStates);

        // Send API request
        fetch("/api/v1/auth/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                Accept: "application/json",
            },
            body: JSON.stringify({ email }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((data) => {
                        throw new Error(
                            data.message || "Failed to send reset link"
                        );
                    });
                }
                return response.json();
            })
            .then((data) => {
                // Update masked email
                maskedEmail.textContent = maskEmail(email);

                // Show success state
                changeState(successState, allStates);
            })
            .catch((err) => {
                // Show error state
                errorMessage.textContent =
                    err.message ||
                    "We couldn't process your request. Please try again.";
                changeState(errorState, allStates);
            });
    });

    // Try again button
    tryAgainButton.addEventListener("click", function () {
        changeState(initialState, allStates);
    });

    // Reset error state when typing
    emailInput.addEventListener("input", function () {
        emailError.classList.remove("show");
    });
});
