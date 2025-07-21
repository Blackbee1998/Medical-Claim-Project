/**
 * Level Employees - API Integration
 *
 * This file contains the API integration functions for the Level Employees management page.
 * It handles CRUD operations and follows Laravel API response patterns.
 *
 * API endpoints used:
 * - GET /api/v1/level-employees (with pagination, filtering, searching)
 * - GET /api/v1/level-employees/{id} (get single level employee)
 * - POST /api/v1/level-employees (create new level employee)
 * - PATCH /api/v1/level-employees/{id} (update level employee)
 * - DELETE /api/v1/level-employees/{id} (delete level employee)
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
 * Get level employees with pagination, filtering, and sorting
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 25)
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} API response with data and pagination
 */
async function fetchLevelEmployees(page = 1, perPage = 25, filters = {}) {
    try {
        // Build query parameters
        const queryParams = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            ...(filters.search && { search: filters.search }),
            ...(filters.sort_by && { sort_by: filters.sort_by }),
            ...(filters.sort_dir && { sort_dir: filters.sort_dir }),
        });

        console.log(
            "Fetching level employees with params:",
            Object.fromEntries(queryParams)
        );

        const response = await fetch(
            `${API_BASE_URL}/level-employees?${queryParams}`,
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
                data.message.toLowerCase().includes("no level employees found")
            ) {
                // Return empty state instead of throwing error
                console.log("No level employees found - returning empty state");
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
        console.error("Error fetching level employees:", error);
        throw error;
    }
}

/**
 * Get a single level employee by ID
 * @param {number} id - Level employee ID
 * @returns {Promise<Object>} Level employee data
 */
async function fetchLevelEmployeeById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/level-employees/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error fetching level employee:", error);
        throw error;
    }
}

/**
 * Create a new level employee
 * @param {Object} levelEmployeeData - Level employee data to create
 * @returns {Promise<Object>} Created level employee data
 */
async function createLevelEmployee(levelEmployeeData) {
    try {
        console.log("Creating level employee:", levelEmployeeData);

        const response = await fetch(`${API_BASE_URL}/level-employees`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(levelEmployeeData),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error creating level employee:", error);
        throw error;
    }
}

/**
 * Update an existing level employee
 * @param {number} id - Level employee ID
 * @param {Object} levelEmployeeData - Updated level employee data
 * @returns {Promise<Object>} Updated level employee data
 */
async function updateLevelEmployee(id, levelEmployeeData) {
    try {
        console.log("Updating level employee:", id, levelEmployeeData);

        const response = await fetch(`${API_BASE_URL}/level-employees/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(levelEmployeeData),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data.data;
    } catch (error) {
        console.error("Error updating level employee:", error);
        throw error;
    }
}

/**
 * Delete a level employee
 * @param {number} id - Level employee ID
 * @returns {Promise<void>}
 */
async function deleteLevelEmployee(id) {
    try {
        console.log("Deleting level employee:", id);

        const response = await fetch(`${API_BASE_URL}/level-employees/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        return data;
    } catch (error) {
        console.error("Error deleting level employee:", error);
        throw error;
    }
}

// Export functions to global scope for use in main.js
window.LevelEmployeesApi = {
    fetchLevelEmployees,
    fetchLevelEmployeeById,
    createLevelEmployee,
    updateLevelEmployee,
    deleteLevelEmployee,
};
