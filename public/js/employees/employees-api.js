/**
 * Employee API Service
 * Handles all API interactions for employee management
 */

// API Configuration
const API_BASE_URL = "/api/v1";
const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints
const ENDPOINTS = {
    EMPLOYEES: `${API_BASE_URL}/employees`,
    EMPLOYEE_DETAIL: (id) => `${API_BASE_URL}/employees/${id}`,
    LEVEL_EMPLOYEES: `${API_BASE_URL}/level-employees`,
    MARRIAGE_STATUSES: `${API_BASE_URL}/marriage-statuses`,
};

// Create an AbortController instance for cancelling fetch requests
let controller = null;

/**
 * Authentication utilities for token management
 */
const Auth = {
    // Token storage keys
    TOKEN_KEY: "access_token",
    REFRESH_TOKEN_KEY: "refresh_token",
    TOKEN_EXPIRY_KEY: "expires_at",
    USER_DATA_KEY: "user",

    /**
     * Get the authentication token from storage
     * @returns {string|null} The stored token or null if not found
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Set the authentication token in storage
     * @param {string} token - The token to store
     * @param {number} expiresIn - Token expiration time in seconds
     */
    setToken(token, expiresIn = 3600) {
        localStorage.setItem(this.TOKEN_KEY, token);

        // Calculate and store expiry time
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    },

    /**
     * Store refresh token
     * @param {string} refreshToken - The refresh token to store
     */
    setRefreshToken(refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    },

    /**
     * Get refresh token
     * @returns {string|null} The refresh token or null if not found
     */
    getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    },

    /**
     * Store user data
     * @param {Object} userData - User data to store
     */
    setUserData(userData) {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    },

    /**
     * Get user data
     * @returns {Object|null} User data or null if not found
     */
    getUserData() {
        const userData = localStorage.getItem(this.USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Remove all authentication data from storage
     */
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        localStorage.removeItem(this.USER_DATA_KEY);
    },

    /**
     * Check if user is authenticated (has a token)
     * @returns {boolean} Whether the user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken() && !this.isTokenExpired();
    },

    /**
     * Check if token is expired based on stored expiry time
     * @returns {boolean} Whether the token is expired
     */
    isTokenExpired() {
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiryTime) return true;

        return Date.now() > parseInt(expiryTime, 10);
    },

    /**
     * Check if token is expired by decoding JWT
     * @param {string} token - The JWT token to check
     * @returns {boolean} Whether the token is expired
     */
    isJwtExpired(token) {
        if (!token) return true;

        try {
            // Extract and parse JWT payload
            const payload = JSON.parse(atob(token.split(".")[1]));

            // Check if token has expired
            return payload.exp * 1000 < Date.now();
        } catch (error) {
            console.error("Error checking token expiration:", error);
            return true;
        }
    },

    /**
     * Refresh the authentication token
     * @returns {Promise<string>} The new token
     */
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();

            if (!refreshToken) {
                throw new Error("No refresh token available");
            }

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to refresh token");
            }

            // Store the new tokens
            this.setToken(data.access_token, data.expires_in);
            if (data.refresh_token) {
                this.setRefreshToken(data.refresh_token);
            }

            return data.access_token;
        } catch (error) {
            console.error("Failed to refresh token:", error);
            this.clearAuth();
            // Redirect to login if token refresh fails
            // window.location.href = '/login';
            throw error;
        }
    },

    /**
     * Handle unauthorized response (401)
     * @returns {Promise<string|null>} The new token or null if refresh failed
     */
    async handleUnauthorized() {
        try {
            // Try to refresh the token
            const newToken = await this.refreshToken();
            return newToken;
        } catch (error) {
            console.error("Authorization failed:", error);
            this.clearAuth();
            // Dispatch an event that the session has expired
            window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
            // Redirect to login
            // window.location.href = '/login';
            return null;
        }
    },

    /**
     * Attempt login with credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response
     */
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Store authentication data
            this.setToken(data.access_token, data.expires_in);
            if (data.refresh_token) {
                this.setRefreshToken(data.refresh_token);
            }

            // Store user data
            if (data.user) {
                this.setUserData(data.user);
            }

            return data;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    },

    /**
     * Logout the user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Call logout API if needed
            const token = this.getToken();
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            // Clear auth data regardless of API call success
            this.clearAuth();
            // Dispatch logout event
            window.dispatchEvent(new CustomEvent("auth:loggedOut"));
        }
    },
};

/**
 * Get the authentication token from storage
 * @returns {string|null} The stored token or null if not found
 */
function getAuthToken() {
    return Auth.getToken();
}

/**
 * Create request headers with authentication
 * @returns {Object} Headers object with authentication
 */
function createHeaders() {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    const token = Auth.getToken();
    if (token) {
        // Check if token is expired
        if (Auth.isTokenExpired()) {
            // Log warning but still include the token
            // Token refresh will be handled in the API call if needed
            console.warn("Token is expired, you may need to log in again");

            // Try to refresh token on next request
            Auth.handleUnauthorized().catch((err) => {
                console.error("Failed to refresh token:", err);
            });
        }

        headers["Authorization"] = `Bearer ${token}`;
    } else {
        console.warn("No authentication token available");
    }

    return headers;
}

/**
 * Handle API response
 * @param {Response} response - Fetch API response
 * @returns {Promise<Object>} Parsed response data
 * @throws {Error} When response is not successful
 */
async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        // Create a structured error object
        const error = new Error(data.message || "API request failed");
        error.status = response.status;
        error.data = data;

        // Handle specific status codes
        switch (response.status) {
            case 400: // Bad Request - Validation errors
                console.error("Validation error:", data);
                break;
            case 401: // Unauthorized
                console.error("Authentication required");
                // Redirect to login if needed
                // window.location.href = '/login';
                break;
            case 403: // Forbidden
                console.error("Access denied");
                break;
            case 404: // Not Found
                console.error("Resource not found");
                break;
            case 409: // Conflict
                console.error("Data conflict:", data);
                break;
            case 500: // Server Error
            default:
                console.error("Server error:", data);
                break;
        }

        throw error;
    }

    // Handle success responses based on request method and status
    if (response.status === 201) {
        console.log("Resource created successfully:", data);
    } else if (response.status === 200) {
        console.log("Operation successful:", data);
    }

    return data;
}

/**
 * Fetch employees with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Paginated employees data
 */
async function fetchEmployees(params = {}) {
    try {
        // Cancel previous request if it exists
        if (controller) {
            controller.abort();
        }

        // Create a new AbortController
        controller = new AbortController();
        const signal = controller.signal;

        // Transform filters to API format
        const apiParams = DataTransformer.filtersFromUiToApi(params);

        // Add pagination params
        if (params.page) apiParams.page = params.page;
        if (params.per_page) apiParams.per_page = params.per_page;

        // Add sorting params
        if (params.sort_by) apiParams.sort_by = params.sort_by;
        if (params.sort_dir) apiParams.sort_dir = params.sort_dir;

        // Build query string
        const queryParams = new URLSearchParams();
        Object.entries(apiParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                queryParams.append(key, value);
            }
        });

        // Make API request
        const url = `${ENDPOINTS.EMPLOYEES}?${queryParams.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: createHeaders(),
            signal: signal,
            timeout: API_TIMEOUT,
        });

        const responseData = await handleResponse(response);

        // Transform data for UI
        return {
            data: DataTransformer.employeeListFromApiToUi(
                responseData.data || []
            ),
            pagination: DataTransformer.paginationFromApiToUi(
                responseData.pagination
            ),
            message: responseData.message,
            status: responseData.status,
        };
    } catch (error) {
        // Check if this was an abort error (we cancelled the request)
        if (error.name === "AbortError") {
            console.log("Request was cancelled");
            // Return a resolved promise with a cancelled status
            return { cancelled: true };
        }

        console.error("Error fetching employees:", error);
        throw error;
    } finally {
        // Clear the controller after the request is complete
        controller = null;
    }
}

/**
 * Fetch a single employee by ID
 * @param {number|string} id - Employee ID
 * @returns {Promise<Object>} Employee data
 */
async function fetchEmployeeById(id) {
    try {
        const response = await fetch(ENDPOINTS.EMPLOYEE_DETAIL(id), {
            method: "GET",
            headers: createHeaders(),
            timeout: API_TIMEOUT,
        });

        const responseData = await handleResponse(response);

        // Transform data for UI
        return {
            data: DataTransformer.employeeFromApiToUi(responseData.data),
            message: responseData.message,
            status: responseData.status,
        };
    } catch (error) {
        console.error(`Error fetching employee ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data to create
 * @returns {Promise<Object>} Created employee data
 */
async function createEmployee(employeeData) {
    try {
        // Transform data for API
        const apiData = DataTransformer.employeeFromUiToApi(employeeData);

        const response = await fetch(ENDPOINTS.EMPLOYEES, {
            method: "POST",
            headers: createHeaders(),
            body: JSON.stringify(apiData),
            timeout: API_TIMEOUT,
        });

        const responseData = await handleResponse(response);

        // Transform response data for UI
        return {
            data: DataTransformer.employeeFromApiToUi(responseData.data),
            message: responseData.message,
            status: responseData.status,
        };
    } catch (error) {
        console.error("Error creating employee:", error);
        throw error;
    }
}

/**
 * Update an existing employee
 * @param {number|string} id - Employee ID
 * @param {Object} employeeData - Updated employee data
 * @returns {Promise<Object>} Updated employee data
 */
async function updateEmployee(id, employeeData) {
    try {
        // Transform data for API
        const apiData = DataTransformer.employeeFromUiToApi(employeeData);

        const response = await fetch(ENDPOINTS.EMPLOYEE_DETAIL(id), {
            method: "PATCH", // Using PATCH as per API routes
            headers: createHeaders(),
            body: JSON.stringify(apiData),
            timeout: API_TIMEOUT,
        });

        const responseData = await handleResponse(response);

        // Transform response data for UI
        return {
            data: DataTransformer.employeeFromApiToUi(responseData.data),
            message: responseData.message,
            status: responseData.status,
        };
    } catch (error) {
        console.error(`Error updating employee ${id}:`, error);
        throw error;
    }
}

/**
 * Delete an employee
 * @param {number|string} id - Employee ID
 * @returns {Promise<Object>} Deletion confirmation
 */
async function deleteEmployee(id) {
    try {
        // Ensure we have a token
        const token = Auth.getToken();
        if (!token) {
            throw new Error("Authentication required. Please log in.");
        }

        // Check token expiration
        if (Auth.isTokenExpired()) {
            // Try to refresh token first
            await Auth.handleUnauthorized();
        }

        const response = await fetch(ENDPOINTS.EMPLOYEE_DETAIL(id), {
            method: "DELETE",
            headers: createHeaders(),
            timeout: API_TIMEOUT,
        });

        return handleResponse(response);
    } catch (error) {
        console.error(`Error deleting employee ${id}:`, error);
        throw error;
    }
}

/**
 * Fetch employee levels for dropdown
 * @returns {Promise<Array>} Array of employee levels
 */
async function fetchEmployeeLevels() {
    try {
        const response = await fetch(ENDPOINTS.LEVEL_EMPLOYEES, {
            method: "GET",
            headers: createHeaders(),
            timeout: API_TIMEOUT,
        });

        const responseData = await handleResponse(response);

        // Format data for dropdowns
        return {
            data: DataTransformer.formatLevelEmployees(responseData.data || []),
            message: responseData.message,
            status: responseData.status,
        };
    } catch (error) {
        console.error("Error fetching employee levels:", error);
        throw error;
    }
}

/**
 * Fetch marriage statuses for dropdown
 * @returns {Promise<Array>} Array of marriage statuses
 */
async function fetchMarriageStatuses() {
    try {
        const response = await fetch(ENDPOINTS.MARRIAGE_STATUSES, {
            method: "GET",
            headers: createHeaders(),
            timeout: API_TIMEOUT,
        });

        const responseData = await handleResponse(response);

        // Format data for dropdowns
        return {
            data: DataTransformer.formatMarriageStatuses(
                responseData.data || []
            ),
            message: responseData.message,
            status: responseData.status,
        };
    } catch (error) {
        console.error("Error fetching marriage statuses:", error);
        throw error;
    }
}

/**
 * Data transformation utilities
 */
const DataTransformer = {
    /**
     * Transform employee data from API format to UI format
     * @param {Object} employee - Employee data from API
     * @returns {Object} Transformed employee data for UI
     */
    employeeFromApiToUi(employee) {
        if (!employee) return null;

        return {
            id: employee.id,
            nik: employee.nik || "",
            name: employee.name || "",
            department: employee.department || "",
            gender: employee.gender || "",

            // Extract IDs from nested objects for form fields
            level_employee_id: employee.level_employee?.id || "",
            marriage_status_id: employee.marriage_status?.id || "",

            // Store the complete nested objects
            level_employee: employee.level_employee
                ? {
                      id: employee.level_employee.id,
                      name: employee.level_employee.name || "",
                  }
                : null,

            marriage_status: employee.marriage_status
                ? {
                      id: employee.marriage_status.id,
                      code: employee.marriage_status.code || "",
                      description: employee.marriage_status.description || "",
                      // Add a display name for consistency
                      name:
                          employee.marriage_status.description ||
                          employee.marriage_status.code ||
                          `Status ${employee.marriage_status.id}`,
                  }
                : null,

            // Format dates if needed
            created_at: employee.created_at
                ? new Date(employee.created_at).toLocaleDateString()
                : "",
            updated_at: employee.updated_at
                ? new Date(employee.updated_at).toLocaleDateString()
                : "",
        };
    },

    /**
     * Transform employee list from API format to UI format
     * @param {Array} employees - Employee list from API
     * @returns {Array} Transformed employee list for UI
     */
    employeeListFromApiToUi(employees) {
        if (!Array.isArray(employees)) return [];

        return employees.map((employee) => this.employeeFromApiToUi(employee));
    },

    /**
     * Transform employee data from UI format to API format for create/update
     * @param {Object} employeeData - Employee data from UI form
     * @returns {Object} Formatted employee data for API
     */
    employeeFromUiToApi(employeeData) {
        // Validate input
        if (!employeeData) return null;

        // Create a clean object with only the fields we need
        const apiData = {
            nik: employeeData.nik?.trim(),
            name: employeeData.name?.trim(),
            department: employeeData.department?.trim(),
            gender: employeeData.gender?.toLowerCase(), // Ensure lowercase for consistency
            level_employee_id:
                parseInt(employeeData.level_employee_id, 25) || null,
            marriage_status_id:
                parseInt(employeeData.marriage_status_id, 10) || null,
        };

        // Remove any undefined values but keep required values
        Object.keys(apiData).forEach((key) => {
            if (apiData[key] === undefined) {
                delete apiData[key];
            }
        });

        // Log a warning if marriage_status_id is null or invalid
        if (!apiData.marriage_status_id) {
            console.warn(
                "ERROR: Invalid or missing marriage_status_id in form data."
            );

            // Ini kritikal: Jika API di backend memiliki validasi required,
            // kita harus memastikan nilai ini selalu ada dan valid
            throw new Error(
                "Marriage status is required. Please select a valid marriage status before saving."
            );
        }

        return apiData;
    },

    /**
     * Transform pagination data from API format to UI format
     * @param {Object} pagination - Pagination data from API
     * @returns {Object} Transformed pagination data for UI
     */
    paginationFromApiToUi(pagination) {
        if (!pagination)
            return {
                currentPage: 1,
                totalPages: 2,
                perPage: 25,
                total: 0,
            };

        // Use the values directly from the API response
        return {
            currentPage: pagination.current_page || 1,
            totalPages: pagination.last_page || 1, // Use last_page directly from API
            perPage: pagination.per_page || 25,
            total: pagination.total || 0,
            from: pagination.from || 0,
            to: pagination.to || 0,
            hasMore: pagination.current_page < pagination.last_page,
        };
    },

    /**
     * Transform filter parameters from UI format to API format
     * @param {Object} filters - Filter parameters from UI
     * @returns {Object} Transformed filter parameters for API
     */
    filtersFromUiToApi(filters) {
        if (!filters) return {};

        const apiFilters = {};

        // Map UI filter names to API parameter names if needed
        if (filters.search) apiFilters.search = filters.search.trim();
        if (filters.department) apiFilters.department = filters.department;
        if (filters.level_employee_id)
            apiFilters.level_employee_id = filters.level_employee_id;
        if (filters.marriage_status_id)
            apiFilters.marriage_status_id = filters.marriage_status_id;
        if (filters.gender) apiFilters.gender = filters.gender.toLowerCase();

        return apiFilters;
    },

    /**
     * Format error response for display
     * @param {Object} error - Error object from API
     * @returns {Object} Formatted error for UI display
     */
    formatErrorForDisplay(error) {
        if (!error) return { message: "Unknown error occurred", details: [] };

        // Default error object
        const formattedError = {
            message: error.message || "An error occurred",
            status: error.status || 500,
            details: [],
        };

        // Format validation errors
        if (error.data?.errors) {
            formattedError.message = error.data.message || "Validation error";
            formattedError.details = Object.entries(error.data.errors).map(
                ([field, messages]) => ({
                    field,
                    message: Array.isArray(messages) ? messages[0] : messages,
                })
            );
        }

        return formattedError;
    },

    /**
     * Format level employee data
     * @param {Array} levels - Level employee data from API
     * @returns {Array} Formatted level employee data for UI
     */
    formatLevelEmployees(levels) {
        if (!Array.isArray(levels)) return [];

        return levels.map((level) => ({
            id: level.id,
            name: level.name || "",
            description: level.description || "",
            value: level.id, // For select dropdown convenience
        }));
    },

    /**
     * Format marriage status data
     * @param {Array} statuses - Marriage status data from API
     * @returns {Array} Formatted marriage status data for UI
     */
    formatMarriageStatuses(statuses) {
        if (!Array.isArray(statuses)) return [];

        return statuses.map((status) => ({
            id: status.id,
            code: status.code || "",
            description: status.description || "",
            value: status.id, // For select dropdown convenience
            name: status.description || status.code || `Status ${status.id}`, // For dropdown display
            created_at: status.created_at || "",
            updated_at: status.updated_at || "",
        }));
    },
};

// Export all API functions and utilities
const EmployeeApi = {
    // API functions
    fetchEmployees,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployeeLevels,
    fetchMarriageStatuses,

    // Authentication utilities
    Auth,

    // Data transformation utilities
    DataTransformer,
};
