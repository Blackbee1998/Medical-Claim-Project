/**
 * Benefit Budgets - API Integration
 *
 * This file contains the API integration functions for the Benefit Budgets management page.
 * It handles CRUD operations and follows Laravel API response patterns.
 *
 * API endpoints used:
 * - GET /api/v1/benefit-budgets (with pagination, filtering, searching)
 * - GET /api/v1/benefit-budgets/{id} (get single benefit budget)
 * - POST /api/v1/benefit-budgets (create new benefit budget)
 * - PATCH /api/v1/benefit-budgets/{id} (update benefit budget)
 * - DELETE /api/v1/benefit-budgets/{id} (delete benefit budget)
 * - GET /api/v1/benefit-types (for dropdown data)
 * - GET /api/v1/level-employees (for dropdown data)
 * - GET /api/v1/marriage-statuses (for dropdown data)
 */

// Base API URL
const API_BASE_URL = "/api/v1";

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with authentication and CSRF tokens
 */
function getAuthHeaders() {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    // Add CSRF token for web requests
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (csrfToken) {
        headers["X-CSRF-TOKEN"] = csrfToken;
    }

    // Add JWT token if available (for authenticated requests)
    const token = window.Auth
        ? window.Auth.token()
        : localStorage.getItem("access_token");
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Handle API errors and provide user feedback
 * @param {Response} response - The fetch response object
 * @param {Object} data - The response data
 */
async function handleApiError(response, data) {
    console.error("API Error:", response.status, data);

    // Handle specific error cases
    if (response.status === 401) {
        // Unauthorized - redirect to login
        if (typeof Swal !== "undefined") {
            await Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Go to Login",
            });
        }
        window.location.href = "/login-form";
        return;
    }

    if (response.status === 422) {
        // Validation errors - don't show generic error, let the form handle it
        const error = new Error("Validation failed");
        error.status = 422;
        error.errors = data.errors || {};
        throw error;
    }

    // Show error message to user
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: "Error",
            text: data.message || "An unexpected error occurred",
            icon: "error",
            confirmButtonText: "OK",
        });
    }

    throw new Error(data.message || "API request failed");
}

/**
 * Get benefit budgets with pagination, filtering, and sorting
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 10)
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} API response with data and pagination
 */
async function fetchBenefitBudgets(page = 1, perPage = 10, filters = {}) {
    try {
        // Build query parameters
        const queryParams = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            ...(filters.benefit_type_id && {
                benefit_type_id: filters.benefit_type_id,
            }),
            ...(filters.level_employee_id && {
                level_employee_id: filters.level_employee_id,
            }),
            ...(filters.marriage_status_id && {
                marriage_status_id: filters.marriage_status_id,
            }),
            ...(filters.year && { year: filters.year }),
            ...(filters.search && { search: filters.search }),
            ...(filters.sort_by && { sort_by: filters.sort_by }),
            ...(filters.sort_dir && { sort_dir: filters.sort_dir }),
        });

        const response = await fetch(
            `${API_BASE_URL}/benefit-budgets?${queryParams}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        // Handle 404 as empty state, not error
        if (!response.ok) {
            if (
                response.status === 404 &&
                data.message &&
                data.message.toLowerCase().includes("no benefit budgets found")
            ) {
                // Return empty state instead of throwing error
                console.log("No benefit budgets found - returning empty state");
                return {
                    data: [],
                    pagination: {
                        total: 0,
                        per_page: perPage,
                        current_page: page,
                        last_page: 1,
                        from: null,
                        to: null,
                    },
                    isEmpty: true, // Flag to indicate this is empty state, not error
                };
            } else {
                await handleApiError(response, data);
            }
        }

        // Transform API response to match frontend expectations
        return {
            data: data.data || [],
            pagination: data.pagination || {
                total: 0,
                per_page: perPage,
                current_page: page,
                last_page: 1,
                from: null,
                to: null,
            },
            isEmpty: !data.data || data.data.length === 0,
        };
    } catch (error) {
        console.error("Error fetching benefit budgets:", error);
        throw error;
    }
}

/**
 * Get a single benefit budget by ID
 * @param {number} id - Benefit budget ID
 * @returns {Promise<Object>} Benefit budget data
 */
async function fetchBenefitBudgetById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-budgets/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error fetching benefit budget:", error);
        throw error;
    }
}

/**
 * Create a new benefit budget
 * @param {Object} benefitBudgetData - Benefit budget data to create
 * @returns {Promise<Object>} Created benefit budget data
 */
async function createBenefitBudget(benefitBudgetData) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-budgets`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(benefitBudgetData),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error creating benefit budget:", error);
        throw error;
    }
}

/**
 * Update an existing benefit budget
 * @param {number} id - Benefit budget ID
 * @param {Object} benefitBudgetData - Updated benefit budget data
 * @returns {Promise<Object>} Updated benefit budget data
 */
async function updateBenefitBudget(id, benefitBudgetData) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-budgets/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(benefitBudgetData),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error updating benefit budget:", error);
        throw error;
    }
}

/**
 * Delete a benefit budget
 * @param {number} id - Benefit budget ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteBenefitBudget(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-budgets/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return true;
    } catch (error) {
        console.error("Error deleting benefit budget:", error);
        throw error;
    }
}

/**
 * Get benefit types for dropdown
 * @returns {Promise<Array>} Array of benefit types
 */
async function fetchBenefitTypes() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/benefit-types?per_page=100`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data || [];
    } catch (error) {
        console.error("Error fetching benefit types:", error);
        throw error;
    }
}

/**
 * Get employee levels for dropdown
 * @returns {Promise<Array>} Array of employee levels
 */
async function fetchEmployeeLevels() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/level-employees?per_page=100`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data || [];
    } catch (error) {
        console.error("Error fetching employee levels:", error);
        throw error;
    }
}

/**
 * Get marriage statuses for dropdown
 * @returns {Promise<Array>} Array of marriage statuses
 */
async function fetchMarriageStatuses() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/marriage-statuses?per_page=100`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data || [];
    } catch (error) {
        console.error("Error fetching marriage statuses:", error);
        throw error;
    }
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Parse currency string to number
 * @param {string} currencyStr - Currency string to parse
 * @returns {number} Parsed number
 */
function parseCurrency(currencyStr) {
    if (!currencyStr) return 0;

    // Handle Indonesian currency format where dot (.) is thousands separator
    // Remove currency symbol (Rp), spaces, and other non-numeric characters except dots
    let cleanStr = currencyStr.toString().replace(/[Rp\s]/g, "");

    // Remove dots (thousands separators) in Indonesian format
    cleanStr = cleanStr.replace(/\./g, "");

    // Convert to number
    const number = parseInt(cleanStr) || 0;

    return number;
}
