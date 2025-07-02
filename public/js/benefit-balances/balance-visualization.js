/**
 * Balance Visualization Utilities
 *
 * Functions for visualizing balance levels with color-coded indicators
 */

// Balance threshold constants
const BALANCE_THRESHOLDS = {
    LOW: 25, // < 25% remaining is low (red)
    MEDIUM: 50, // 25-50% is medium (yellow), > 50% is high (green)
};

// Get the balance status class based on usage percentage
function getBalanceStatusClass(usagePercentage) {
    const remainingPercentage = 100 - usagePercentage;

    if (remainingPercentage < BALANCE_THRESHOLDS.LOW) {
        return "balance-low";
    } else if (remainingPercentage < BALANCE_THRESHOLDS.MEDIUM) {
        return "balance-medium";
    } else {
        return "balance-high";
    }
}

// Get the balance status text based on usage percentage
function getBalanceStatusText(usagePercentage) {
    const remainingPercentage = 100 - usagePercentage;

    if (remainingPercentage < BALANCE_THRESHOLDS.LOW) {
        return "Low Balance";
    } else if (remainingPercentage < BALANCE_THRESHOLDS.MEDIUM) {
        return "Medium Balance";
    } else {
        return "Healthy Balance";
    }
}

// Get the balance status class for text
function getBalanceStatusTextClass(usagePercentage) {
    const remainingPercentage = 100 - usagePercentage;

    if (remainingPercentage < BALANCE_THRESHOLDS.LOW) {
        return "balance-status-low";
    } else if (remainingPercentage < BALANCE_THRESHOLDS.MEDIUM) {
        return "balance-status-medium";
    } else {
        return "balance-status-high";
    }
}

// Get the balance indicator class for the dot
function getBalanceIndicatorClass(usagePercentage) {
    const remainingPercentage = 100 - usagePercentage;

    if (remainingPercentage < BALANCE_THRESHOLDS.LOW) {
        return "balance-status-indicator-low";
    } else if (remainingPercentage < BALANCE_THRESHOLDS.MEDIUM) {
        return "balance-status-indicator-medium";
    } else {
        return "balance-status-indicator-high";
    }
}

// Create a progress bar element for a balance
function createBalanceProgressBar(
    currentBalance,
    initialBalance,
    usagePercentage
) {
    // Calculate remaining percentage
    const remainingPercentage = 100 - usagePercentage;

    // Determine the status class
    const statusClass = getBalanceStatusClass(usagePercentage);
    const statusTextClass = getBalanceStatusTextClass(usagePercentage);
    const indicatorClass = getBalanceIndicatorClass(usagePercentage);
    const statusText = getBalanceStatusText(usagePercentage);

    // Create container
    const container = document.createElement("div");

    // Create progress bar
    const progressContainer = document.createElement("div");
    progressContainer.className = "balance-progress-container";

    const progressBar = document.createElement("div");
    progressBar.className = `balance-progress-bar ${statusClass}`;
    progressBar.style.width = `${remainingPercentage}%`;

    progressContainer.appendChild(progressBar);

    // Create status text
    const status = document.createElement("div");
    status.className = `balance-status ${statusTextClass}`;

    const indicator = document.createElement("span");
    indicator.className = `balance-status-indicator ${indicatorClass}`;

    const text = document.createElement("span");
    text.textContent = statusText;

    status.appendChild(indicator);
    status.appendChild(text);

    // Append everything to container
    container.appendChild(progressContainer);
    container.appendChild(status);

    return container;
}

// Format currency values (IDR)
function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format date string to locale date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
