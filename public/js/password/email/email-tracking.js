/**
 * Email Tracking and Analytics
 */

/**
 * Tracks email opens using a pixel beacon
 *
 * @param {string} emailType - Type of email (e.g., 'reset_password')
 * @param {string} emailId - Unique identifier for the email
 */
function trackEmailOpen(emailType, emailId) {
    // Create a tracking pixel
    const pixel = new Image();
    pixel.src = `/api/v1/email-tracking/open?type=${encodeURIComponent(
        emailType
    )}&id=${encodeURIComponent(emailId)}&t=${Date.now()}`;
    pixel.style.display = "none";
    document.body.appendChild(pixel);
}

/**
 * Tracks link clicks in emails
 *
 * @param {string} url - The URL being clicked
 * @param {string} emailType - Type of email
 * @param {string} emailId - Unique identifier for the email
 * @param {string} linkType - Type of link (e.g., 'reset_button', 'help_link')
 */
function trackEmailLinkClick(url, emailType, emailId, linkType) {
    // First, record the click
    fetch("/api/v1/email-tracking/click", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url,
            emailType,
            emailId,
            linkType,
            timestamp: Date.now(),
        }),
        keepalive: true, // Ensures the request completes even if the page navigates away
    }).catch((err) => {
        console.error("Failed to track email link click:", err);
    });

    // Then allow the navigation to continue
    return true;
}

/**
 * Adds tracking parameters to all links in an email
 */
function setupEmailTracking() {
    // Get email metadata from data attributes
    const emailContainer = document.querySelector("[data-email-type]");
    if (!emailContainer) return;

    const emailType = emailContainer.dataset.emailType;
    const emailId = emailContainer.dataset.emailId;

    // Track email open
    trackEmailOpen(emailType, emailId);

    // Add click tracking to all links
    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
        const linkType = link.dataset.linkType || "generic";

        // Preserve original click handler if any
        const originalOnClick = link.onclick;

        link.onclick = function (e) {
            // Call tracking function
            trackEmailLinkClick(link.href, emailType, emailId, linkType);

            // Call original handler if it exists
            if (originalOnClick) {
                return originalOnClick.call(this, e);
            }
            return true;
        };
    });
}

// Setup tracking when the email is opened (if in a browser that executes JS)
if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", setupEmailTracking);
}
