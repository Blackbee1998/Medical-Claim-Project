/**
 * Email Utility Functions for Password Reset
 */

/**
 * Formats a URL to be displayed with line breaks at appropriate points
 *
 * @param {string} url - The URL to format
 * @param {number} maxLength - Maximum length before inserting a line break
 * @returns {string} - Formatted URL with line breaks
 */
function formatUrlForDisplay(url, maxLength = 40) {
    if (!url || url.length <= maxLength) return url;

    // Add zero-width spaces to allow line breaks
    let formattedUrl = "";
    for (let i = 0; i < url.length; i++) {
        formattedUrl += url[i];
        if (i % maxLength === 0 && i > 0) {
            formattedUrl += "&#8203;"; // Zero-width space for line breaking
        }
    }

    return formattedUrl;
}

/**
 * Validates the reset token to ensure it's in the expected format
 *
 * @param {string} token - The reset token to validate
 * @returns {boolean} - Whether the token is valid
 */
function isValidResetToken(token) {
    if (!token) return false;

    // Basic validation - you might want to adjust based on your token format
    return token.length >= 10;
}

/**
 * Extracts a token from a URL query parameter
 *
 * @param {string} url - The URL to extract from
 * @param {string} paramName - The parameter name (default: 'token')
 * @returns {string|null} - The extracted token or null if not found
 */
function extractTokenFromUrl(url, paramName = "token") {
    if (!url) return null;

    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get(paramName);
    } catch (e) {
        console.error("Invalid URL:", e);
        return null;
    }
}

/**
 * Adds tracking parameters to a URL for email analytics
 *
 * @param {string} url - The URL to add tracking to
 * @param {Object} params - The tracking parameters
 * @returns {string} - URL with tracking parameters
 */
function addTrackingToUrl(url, params = {}) {
    if (!url) return url;

    try {
        const urlObj = new URL(url);

        // Add default tracking parameters
        urlObj.searchParams.append("utm_source", params.source || "email");
        urlObj.searchParams.append(
            "utm_medium",
            params.medium || "reset_password"
        );
        urlObj.searchParams.append(
            "utm_campaign",
            params.campaign || "account_recovery"
        );

        return urlObj.toString();
    } catch (e) {
        console.error("Error adding tracking parameters:", e);
        return url;
    }
}
