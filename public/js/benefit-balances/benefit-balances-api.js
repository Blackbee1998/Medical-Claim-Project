/**
 * Employee Benefit Balances - API Integration
 *
 * This file contains the API integration functions for the Employee Benefit Balances page.
 * Now using real API endpoints instead of mock data.
 *
 * API endpoints used:
 * - GET /api/v1/employee-benefit-balances (with pagination, filtering, searching)
 * - POST /api/v1/employee-benefit-balances/initialize
 * - GET /api/v1/employees (for dropdown reference)
 * - GET /api/v1/benefit-types (for dropdown reference)
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
 * Handle API errors consistently
 * @param {Response} response - Fetch response object
 * @param {Object} data - Response data
 */
async function handleApiError(response, data) {
    let errorMessage = "An error occurred while processing your request";

    if (data && data.message) {
        errorMessage = data.message;
    } else if (response.status === 401) {
        errorMessage = "Authentication required. Please login.";
        // Redirect to login if unauthorized
        if (window.Auth && window.Auth.logout) {
            window.Auth.logout();
        }
    } else if (response.status === 403) {
        errorMessage =
            "Access denied. You do not have permission to perform this action.";
    } else if (response.status === 404) {
        errorMessage = "The requested resource was not found.";
    } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
    }

    throw new Error(errorMessage);
}

/**
 * Get employee benefit balances with pagination and filtering
 */
async function fetchBenefitBalances(page = 1, perPage = 10, filters = {}) {
    try {
        // Build query parameters
        const queryParams = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            ...(filters.employeeId && { employee_id: filters.employeeId }),
            ...(filters.benefitTypeId && {
                benefit_type_id: filters.benefitTypeId,
            }),
            ...(filters.year && { year: filters.year }),
            ...(filters.searchQuery && { search: filters.searchQuery }),
        });

        const response = await fetch(
            `${API_BASE_URL}/employee-benefit-balances?${queryParams}`,
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
                data.message
                    .toLowerCase()
                    .includes("no employee benefit balances found")
            ) {
                // Return empty state instead of throwing error
                console.log(
                    "No employee benefit balances found - returning empty state"
                );
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
        console.error("Error fetching benefit balances:", error);
        throw error;
    }
}

/**
 * Get summary statistics for benefit balances
 */
async function fetchSummaryStatistics(filters = {}) {
    try {
        // For now, we'll calculate this from the main data
        // In the future, this could be a separate endpoint
        const allData = await fetchBenefitBalances(1, 1000, filters); // Get all data for stats

        const balances = allData.data;

        // Calculate statistics
        const uniqueEmployees = new Set(
            balances.map((b) => b.employee?.id || b.employee_id)
        ).size;

        const totalBudget = balances.reduce((sum, b) => {
            const budget = b.benefit_budget?.budget || 0;
            return sum + parseFloat(budget);
        }, 0);

        const totalRemaining = balances.reduce((sum, b) => {
            const currentBalance = b.current_balance || 0;
            return sum + parseFloat(currentBalance);
        }, 0);

        // Calculate average usage percentage
        const averageUsage =
            balances.length > 0
                ? Math.round(
                      balances.reduce((sum, b) => {
                          const budget = parseFloat(
                              b.benefit_budget?.budget || 0
                          );
                          const current = parseFloat(b.current_balance || 0);
                          const usage =
                              budget > 0
                                  ? ((budget - current) / budget) * 100
                                  : 0;
                          return sum + usage;
                      }, 0) / balances.length
                  )
                : 0;

        return {
            employeeCount: uniqueEmployees,
            totalBudget: totalBudget,
            totalRemaining: totalRemaining,
            averageUsage: averageUsage,
        };
    } catch (error) {
        console.error("Error fetching summary statistics:", error);
        throw error;
    }
}

// Global flag to prevent multiple simultaneous initialization calls
let isInitializationInProgress = false;

/**
 * Initialize benefit balances
 */
async function initializeBenefitBalancesApi(year, employeeIds = []) {
    const apiRequestId = Math.random().toString(36).substring(7);
    console.log(
        `[API-${apiRequestId}] Initialize request received for year ${year}`
    );

    // Prevent multiple simultaneous initialization calls
    if (isInitializationInProgress) {
        console.warn(
            `[API-${apiRequestId}] API Level: Initialization already in progress, rejecting duplicate call`
        );
        throw new Error(
            "Initialization already in progress. Please wait for the current process to complete."
        );
    }

    try {
        isInitializationInProgress = true;
        console.log(`[API-${apiRequestId}] API protection flag set to true`);
        console.log(
            `[API-${apiRequestId}] Starting API call to initialize balances for year ${year}...`
        );

        const payload = {
            year,
            employee_ids:
                employeeIds && employeeIds.length > 0 ? employeeIds : null, // null means all employees
        };

        console.log(`[API-${apiRequestId}] Request payload:`, payload);

        const response = await fetch(
            `${API_BASE_URL}/employee-benefit-balances/initialize`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            }
        );

        console.log(
            `[API-${apiRequestId}] Response status: ${response.status}`
        );

        const data = await response.json();

        if (!response.ok) {
            console.log(`[API-${apiRequestId}] API error response:`, data);
            await handleApiError(response, data);
        }

        console.log(
            `[API-${apiRequestId}] API call completed successfully:`,
            data
        );
        return data;
    } catch (error) {
        console.error(`[API-${apiRequestId}] Error in API call:`, error);
        throw error;
    } finally {
        isInitializationInProgress = false;
        console.log(`[API-${apiRequestId}] API protection flag cleared`);
    }
}

/**
 * Export benefit balances to CSV
 * Currently using client-side generation since no export endpoint exists yet
 */
async function exportBenefitBalancesApi(filters = {}) {
    try {
        // Get all data for export
        const allData = await fetchBenefitBalances(1, 10000, filters); // Large page size to get all
        const balances = allData.data;

        // Generate CSV content
        const headers = [
            "Employee Name",
            "Employee NIK",
            "Department",
            "Benefit Type",
            "Year",
            "Initial Balance",
            "Current Balance",
            "Usage Amount",
            "Usage Percentage",
            "Last Updated",
        ];

        const csvContent = [
            headers.join(","),
            ...balances.map((balance) => {
                const employee = balance.employee || {};
                const benefitBudget = balance.benefit_budget || {};
                const benefitType = benefitBudget.benefit_type || {};

                const initialBalance = parseFloat(benefitBudget.budget || 0);
                const currentBalance = parseFloat(balance.current_balance || 0);
                const usageAmount = initialBalance - currentBalance;
                const usagePercentage =
                    initialBalance > 0
                        ? Math.round((usageAmount / initialBalance) * 100)
                        : 0;

                return [
                    `"${employee.name || ""}"`,
                    `"${employee.nik || ""}"`,
                    `"${employee.department || ""}"`,
                    `"${benefitType.name || ""}"`,
                    benefitBudget.year || "",
                    initialBalance,
                    currentBalance,
                    usageAmount,
                    usagePercentage + "%",
                    `"${balance.updated_at || balance.created_at || ""}"`,
                ].join(",");
            }),
        ].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:-]/g, "");
        const filename = `employee_benefit_balances_${timestamp}.csv`;

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return {
            success: true,
            filename,
            rowCount: balances.length,
        };
    } catch (error) {
        console.error("Error exporting benefit balances:", error);
        throw error;
    }
}

/**
 * Fetch employees with department mapping
 * @returns {Object} Map of employee_id -> employee data including department
 */
async function fetchEmployeesWithDepartments() {
    try {
        const queryParams = new URLSearchParams({
            fields: "id,name,nik,department",
            per_page: "1000", // Get all employees
        });

        const response = await fetch(
            `${API_BASE_URL}/employees?${queryParams}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        // Create a mapping of employee_id -> employee data
        const employeeMap = {};
        (data.data || []).forEach((employee) => {
            employeeMap[employee.id] = {
                id: employee.id,
                name: employee.name,
                nik: employee.nik,
                department: employee.department || "N/A",
            };
        });

        console.log(
            "Employee departments mapping loaded:",
            Object.keys(employeeMap).length,
            "employees"
        );
        return employeeMap;
    } catch (error) {
        console.error("Error fetching employees with departments:", error);
        throw error;
    }
}

/**
 * Fetch employees for dropdown with search capability
 * @param {string} searchTerm - Optional search term
 * @returns {Promise<Array>} Array of employees
 */
async function fetchAllEmployees(searchTerm = "") {
    if (isInitializationInProgress) {
        console.log(
            "Initialization in progress, skipping fetchAllEmployees request"
        );
        return [];
    }

    try {
        // Build query parameters
        const queryParams = new URLSearchParams();

        // Add search parameter if provided
        if (searchTerm && searchTerm.trim()) {
            queryParams.append("search", searchTerm.trim());
        }

        // Request all employees (set high per_page to get all)
        queryParams.append("per_page", "1000");
        queryParams.append("sort_by", "name");
        queryParams.append("sort_dir", "asc");

        const url = `${API_BASE_URL}/employees?${queryParams.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        // Transform data to include search fields
        const employees = data.data || [];
        return employees.map((employee) => ({
            id: employee.id,
            nik: employee.nik,
            name: employee.name,
            department: employee.department,
            // Create searchable text combining all fields
            searchText:
                `${employee.nik} ${employee.name} ${employee.department}`.toLowerCase(),
            // Display text for the select option
            displayText: `${employee.nik} - ${employee.name} (${employee.department})`,
        }));
    } catch (error) {
        console.error("Error fetching all employees:", error);

        // Show user-friendly error message
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "error",
                title: "Error Loading Employees",
                text: "Failed to load employee data. Please try again.",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });
        }

        return [];
    }
}

/**
 * Fetch employees for dropdown
 */
async function fetchEmployees() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/employees?fields=id,name,nik,department`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        // Transform to match expected format
        return data.data || [];
    } catch (error) {
        console.error("Error fetching employees:", error);
        // Fallback to empty array to prevent UI breaking
        return [];
    }
}

/**
 * Fetch benefit types for dropdown
 */
async function fetchBenefitTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-types`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            await handleApiError(response, data);
        }

        // Transform to match expected format
        return data.data || [];
    } catch (error) {
        console.error("Error fetching benefit types:", error);
        // Fallback to empty array to prevent UI breaking
        return [];
    }
}

// Export functions
const BenefitBalancesApi = {
    fetchBenefitBalances,
    fetchEmployees,
    fetchAllEmployees,
    fetchEmployeesWithDepartments,
    fetchBenefitTypes,
    initializeBenefitBalances: initializeBenefitBalancesApi,
    getAuthHeaders,
    handleApiError,
};
