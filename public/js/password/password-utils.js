/**
 * Password functionality utility functions
 */

/**
 * Changes the current form state
 *
 * @param {HTMLElement} state - The state element to activate
 * @param {Array} allStates - All available state elements
 */
function changeState(state, allStates) {
    // Hide all states
    allStates.forEach((s) => s.classList.remove("active"));

    // Show requested state
    state.classList.add("active");
}

/**
 * Validates email format
 *
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
    const re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Masks email for privacy
 *
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
function maskEmail(email) {
    if (!email) return "";
    const parts = email.split("@");
    if (parts.length !== 2) return email;

    const name = parts[0];
    const domain = parts[1];

    // Show first character, mask the rest
    const maskedName =
        name.charAt(0) +
        "***" +
        (name.length > 3 ? name.charAt(name.length - 1) : "");

    return maskedName + "@" + domain;
}

/**
 * Gets CSRF token from meta tag
 *
 * @returns {string} CSRF token
 */
function getCsrfToken() {
    return document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
}

/**
 * Toggles password visibility
 *
 * @param {HTMLInputElement} inputField - Password input field
 * @param {HTMLElement} icon - Toggle icon element
 */
function togglePasswordVisibility(inputField, icon) {
    if (inputField.type === "password") {
        inputField.type = "text";
        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");
    } else {
        inputField.type = "password";
        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");
    }
}
