/**
 * Authentication Middleware JavaScript
 *
 * This file contains authentication checks for frontend pages.
 * It redirects unauthenticated users to the login page.
 * Place this script on any protected page.
 *
 * @module AuthMiddleware
 */

(function () {
    "use strict";

    /**
     * Check if the user is authenticated
     * Redirects to login page if not authenticated
     */
    function checkAuth() {
        const token = localStorage.getItem("access_token");
        const expiresAt = localStorage.getItem("expires_at");

        // If no token or expired token, redirect to login
        if (!token || !expiresAt || Date.now() >= parseInt(expiresAt)) {
            // Clean up localStorage except for remember_me
            const rememberMe = localStorage.getItem("remember_me");
            localStorage.clear();

            // Keep remember_me setting if it exists
            if (rememberMe) {
                localStorage.setItem("remember_me", rememberMe);
            }

            // Redirect to login page with return URL
            window.location.href = `/login-form?return_url=${encodeURIComponent(
                window.location.pathname
            )}`;
            return false;
        }

        return true;
    }

    /**
     * Get the authenticated user data
     * @returns {Object|null} The user data or null if not authenticated
     */
    function getAuthUser() {
        if (!checkAuth()) {
            return null;
        }

        const userData = localStorage.getItem("user");
        if (!userData) {
            return null;
        }

        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error("Error parsing user data", e);
            return null;
        }
    }

    /**
     * Get the authentication token
     * @returns {string|null} The token or null if not authenticated
     */
    function getAuthToken() {
        if (!checkAuth()) {
            return null;
        }

        return localStorage.getItem("access_token");
    }

    /**
     * Logout the user
     * @param {boolean} redirect - Whether to redirect to login page
     * @returns {Promise<void>}
     */
    async function logout(redirect = true) {
        const token = getAuthToken();

        if (token) {
            try {
                // Get CSRF token
                const csrfToken = document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content");

                // Call logout API
                await fetch("/api/v1/auth/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        "X-CSRF-TOKEN": csrfToken,
                        Accept: "application/json",
                    },
                });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }

        // Clear localStorage except for remember_me
        const rememberMe = localStorage.getItem("remember_me");
        localStorage.clear();

        // Keep remember_me setting if it exists
        if (rememberMe) {
            localStorage.setItem("remember_me", rememberMe);
        }

        // Redirect to login page
        if (redirect) {
            window.location.href = "/login-form";
        }
    }

    // Check authentication on page load
    document.addEventListener("DOMContentLoaded", checkAuth);

    // Expose functions to global scope
    window.Auth = {
        check: checkAuth,
        user: getAuthUser,
        token: getAuthToken,
        logout: logout,
    };
})();
