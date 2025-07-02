/**
 * Login Form JavaScript
 *
 * This file contains all the JavaScript functionality for the login form.
 * It handles form validation, API interaction, and SweetAlert2 integration.
 *
 * @module LoginForm
 */

(function () {
    "use strict";

    // DOM Elements
    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberInput = document.getElementById("remember");
    const loginButton = document.getElementById("loginButton");
    const spinner = loginButton.querySelector(".spinner-border");

    // Get return URL from query parameter if exists
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get("return_url") || "/";

    /**
     * Initialize the login form
     */
    function init() {
        setupEventListeners();
    }

    /**
     * Set up all event listeners for the form
     */
    function setupEventListeners() {
        // Form submission
        form.addEventListener("submit", handleFormSubmit);

        // Reset invalid state when input changes
        const formInputs = form.querySelectorAll("input");
        formInputs.forEach((input) => {
            input.addEventListener("input", function () {
                this.classList.remove("is-invalid");
            });
        });
    }

    /**
     * Validate the form inputs
     * @returns {boolean} - Whether the form is valid
     */
    function validateForm() {
        let isValid = true;

        // Username validation
        if (!usernameInput.value.trim()) {
            usernameInput.classList.add("is-invalid");
            usernameInput.nextElementSibling.nextElementSibling.textContent =
                "Please enter your username.";
            isValid = false;
        }

        // Password validation
        if (!passwordInput.value) {
            passwordInput.classList.add("is-invalid");
            passwordInput.nextElementSibling.nextElementSibling.textContent =
                "Please enter your password.";
            isValid = false;
        }

        return isValid;
    }

    /**
     * Handle form submission
     * @param {Event} event - The submit event
     */
    async function handleFormSubmit(event) {
        event.preventDefault();

        if (validateForm()) {
            // Set button to loading state
            setLoading(true);

            try {
                // Collect form data
                const formData = {
                    username: usernameInput.value,
                    password: passwordInput.value,
                };

                // Get the CSRF token
                const csrfToken = document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content");
                if (!csrfToken) {
                    throw new Error("CSRF token not found");
                }

                // Send the request to the API endpoint
                await submitLogin(formData, csrfToken);
            } catch (error) {
                // Handle network or other errors
                console.error("Login error:", error);

                // Show error message with SweetAlert2
                showError(
                    "Connection Error",
                    error.message ||
                        "A network error occurred. Please try again later."
                );
            } finally {
                // Reset button state
                setLoading(false);
            }
        }
    }

    /**
     * Set the loading state of the login button
     * @param {boolean} isLoading - Whether the button is in loading state
     */
    function setLoading(isLoading) {
        if (isLoading) {
            loginButton.disabled = true;
            loginButton.classList.add("btn-loading");
            spinner.classList.remove("d-none");
        } else {
            loginButton.disabled = false;
            loginButton.classList.remove("btn-loading");
            spinner.classList.add("d-none");
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
        timer = 2000
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
     * Submit login data to the API
     * @param {Object} formData - The login form data
     * @param {string} csrfToken - The CSRF token
     * @returns {Promise<void>}
     */
    async function submitLogin(formData, csrfToken) {
        try {
            const response = await fetch("/api/v1/auth/login", {
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
            if (response.ok && data.status === 200) {
                // Store access token in localStorage
                localStorage.setItem(
                    "access_token",
                    data.data.tokens.access_token
                );
                localStorage.setItem(
                    "refresh_token",
                    data.data.tokens.refresh_token
                );

                // Store user data
                localStorage.setItem("user", JSON.stringify(data.data.user));

                // Set expiration time (convert to milliseconds)
                const expiresAt =
                    Date.now() + data.data.tokens.expires_in * 1000;
                localStorage.setItem("expires_at", expiresAt);

                // If remember me is checked, store a flag
                if (rememberInput.checked) {
                    localStorage.setItem("remember_me", "true");
                }

                // Show success message with SweetAlert2 and redirect to the return URL
                showSuccessWithRedirect(
                    "Login Successful!",
                    "You have successfully logged in. Redirecting...",
                    returnUrl // Use the return URL from the query parameter
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
        let errorMessage = "Login failed. Please try again.";

        // Handle different types of error responses
        if (data.message) {
            errorMessage = data.message;
        }

        // Show error message with SweetAlert2
        showError("Login Failed", errorMessage);

        // Highlight fields with errors if they are returned
        if (data.status === 401) {
            usernameInput.classList.add("is-invalid");
            passwordInput.classList.add("is-invalid");
        }
    }

    /**
     * Check if the user is already logged in
     * If they are, redirect to the dashboard
     */
    function checkAuthentication() {
        const token = localStorage.getItem("access_token");
        const expiresAt = localStorage.getItem("expires_at");

        if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
            window.location.href = returnUrl;
            return true;
        }

        // Clear localStorage if token exists but has expired
        if (token && (!expiresAt || Date.now() >= parseInt(expiresAt))) {
            // Only keep remember_me flag if it exists
            const rememberMe = localStorage.getItem("remember_me");
            localStorage.clear();
            if (rememberMe) {
                localStorage.setItem("remember_me", rememberMe);
            }
        }

        return false;
    }

    /**
     * Prefill username if remember_me is set
     */
    function loadRememberedUser() {
        if (localStorage.getItem("remember_me") === "true") {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    if (user && user.username) {
                        usernameInput.value = user.username;
                        rememberInput.checked = true;
                    }
                } catch (e) {
                    console.error("Error parsing remembered user data", e);
                }
            }
        }
    }

    // Check authentication first
    if (!checkAuthentication()) {
        // If not authenticated, try to load remembered user
        loadRememberedUser();
    }

    // Initialize the form when the DOM is fully loaded
    document.addEventListener("DOMContentLoaded", init);
})();
