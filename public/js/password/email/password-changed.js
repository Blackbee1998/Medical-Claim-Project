/**
 * Password Change Confirmation Email JavaScript
 */

/**
 * Animate the success checkmark icon
 */
function animateSuccessIcon() {
    const icon = document.querySelector(".success-icon");
    if (icon) {
        // Ensure the animation plays if the email is opened in a client that supports JS
        icon.style.visibility = "visible";
    }
}

/**
 * Handle the "Review Activity" button click
 *
 * @param {string} accountActivityUrl - URL to the account activity page
 * @param {Event} event - Click event
 */
function handleReviewActivity(accountActivityUrl, event) {
    // We could add additional functionality here if needed
    // For now, just navigate to the URL
    window.location.href = accountActivityUrl;

    // For analytics, we can track this click
    if (typeof trackEmailLinkClick === "function") {
        trackEmailLinkClick(
            accountActivityUrl,
            "password_changed",
            document.querySelector("[data-email-id]")?.dataset.emailId || "",
            "review_activity"
        );
    }
}

/**
 * Initialize event listeners and animations
 */
function initPasswordChangedEmail() {
    // Run animations
    animateSuccessIcon();

    // Set up listeners
    const reviewButton = document.querySelector(".review-activity-btn");
    if (reviewButton) {
        const url = reviewButton.getAttribute("href");
        reviewButton.addEventListener("click", function (e) {
            e.preventDefault();
            handleReviewActivity(url, e);
        });
    }
}

// Initialize when DOM is ready
if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initPasswordChangedEmail);
}
