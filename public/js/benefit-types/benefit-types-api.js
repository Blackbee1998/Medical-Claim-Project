/**
 * Benefit Types - API Integration
 *
 * This file contains the API integration functions for the Benefit Types management page.
 * It handles CRUD operations and follows Laravel API response patterns.
 *
 * API endpoints used:
 * - GET /api/v1/benefit-types (with pagination, filtering, searching)
 * - GET /api/v1/benefit-types/{id} (get single benefit type)
 * - POST /api/v1/benefit-types (create new benefit type)
 * - PATCH /api/v1/benefit-types/{id} (update benefit type)
 * - DELETE /api/v1/benefit-types/{id} (delete benefit type)
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
 * Get benefit types with pagination, filtering, and sorting
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 10)
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} API response with data and pagination
 */
async function fetchBenefitTypes(page = 1, perPage = 10, filters = {}) {
    try {
        // Build query parameters
        const queryParams = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            ...(filters.search && { search: filters.search }),
            ...(filters.sort_by && { sort_by: filters.sort_by }),
            ...(filters.sort_dir && { sort_dir: filters.sort_dir }),
        });

        const response = await fetch(
            `${API_BASE_URL}/benefit-types?${queryParams}`,
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
                data.message.toLowerCase().includes("no benefit types found")
            ) {
                // Return empty state instead of throwing error
                console.log("No benefit types found - returning empty state");
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
        console.error("Error fetching benefit types:", error);
        throw error;
    }
}

/**
 * Get a single benefit type by ID
 * @param {number} id - Benefit type ID
 * @returns {Promise<Object>} Benefit type data
 */
async function fetchBenefitTypeById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-types/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error fetching benefit type:", error);
        throw error;
    }
}

/**
 * Create a new benefit type
 * @param {Object} benefitTypeData - Benefit type data to create
 * @returns {Promise<Object>} Created benefit type data
 */
async function createBenefitType(benefitTypeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-types`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(benefitTypeData),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error creating benefit type:", error);
        throw error;
    }
}

/**
 * Update an existing benefit type
 * @param {number} id - Benefit type ID
 * @param {Object} benefitTypeData - Updated benefit type data
 * @returns {Promise<Object>} Updated benefit type data
 */
async function updateBenefitType(id, benefitTypeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-types/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(benefitTypeData),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error updating benefit type:", error);
        throw error;
    }
}

/**
 * Delete a benefit type
 * @param {number} id - Benefit type ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteBenefitType(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-types/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return true;
    } catch (error) {
        console.error("Error deleting benefit type:", error);
        throw error;
    }
}

// Export functions
const BenefitTypesApi = {
    fetchBenefitTypes,
    fetchBenefitTypeById,
    createBenefitType,
    updateBenefitType,
    deleteBenefitType,
    getAuthHeaders,
    handleApiError,
};

// Make functions available globally for backward compatibility
window.BenefitTypesApi = BenefitTypesApi;
