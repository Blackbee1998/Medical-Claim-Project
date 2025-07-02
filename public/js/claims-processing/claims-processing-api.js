/**
 * Claims Processing API Integration
 *
 * API layer for claims processing functionality with comprehensive mock data simulation
 */

// Configuration
const API_BASE_URL = "/api/v1";

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    console.log("🔐 Getting auth headers, token exists:", !!token);
    console.log(
        "🔑 Token preview:",
        token ? `${token.substring(0, 20)}...` : "No token"
    );

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN":
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") || "",
    };
}

// Handle authentication errors
function handleAuthError(error) {
    if (error.message.includes("Authentication required")) {
        // Clear any existing token
        localStorage.removeItem("access_token");

        // Show user-friendly message
        if (window.showError) {
            window.showError("Your session has expired. Please login again.");
        }

        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = "/login";
        }, 2000);

        return true; // Indicates auth error was handled
    }
    return false; // Not an auth error
}

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem("access_token");
    return !!token;
}

// Temporary function to get or prompt for token
function ensureAuthentication() {
    let token = localStorage.getItem("access_token");

    if (!token) {
        console.warn("🚨 No access token found. For testing, you need to:");
        console.warn("1. Login via /login page first, OR");
        console.warn("2. Set a test token manually:");
        console.warn(
            "   localStorage.setItem('access_token', 'your_token_here')"
        );

        // For development/testing - prompt user
        if (
            confirm(
                "No authentication token found. Do you want to set a test token? (Check console for instructions)"
            )
        ) {
            const testToken = prompt("Enter access token for testing:");
            if (testToken) {
                localStorage.setItem("access_token", testToken);
                console.log("✅ Test token set successfully");
                return testToken;
            }
        }

        throw new Error("Authentication required. Please login first.");
    }

    return token;
}

// Function removed - no longer needed for real API calls

// Mock data removed - now using real API calls

/**
 * Search employees by query
 */
async function searchEmployees(query) {
    try {
        if (!query || query.length < 2) {
            return { data: [] };
        }

        // Ensure we have authentication token
        ensureAuthentication();

        console.log("🔍 Searching for employees with query:", query);

        const url = `${API_BASE_URL}/employees?search=${encodeURIComponent(
            query
        )}&per_page=10`;
        console.log("📡 Request URL:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        console.log("📨 Response status:", response.status);
        console.log("📨 Response ok:", response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API Error Response:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ API Response:", result);

        return {
            data: result.data || [],
            total: result.pagination?.total || 0,
        };
    } catch (error) {
        console.error("❌ Search employees error:", error);

        // Return empty result instead of throwing error to prevent breaking UI
        return {
            data: [],
            total: 0,
            error: error.message,
        };
    }
}

/**
 * Get employee benefit summary
 */
async function getEmployeeBenefitSummary(employeeId) {
    try {
        // Ensure we have authentication token
        ensureAuthentication();

        const response = await fetch(
            `${API_BASE_URL}/employee-balances/${employeeId}/summary`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Authentication required. Please login.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("🔍 Raw API Response:", result);

        // Transform API response to match expected format
        const balanceData = result.data || {};
        console.log("📊 Balance Data:", balanceData);

        // Fix: Use 'balances' instead of 'benefit_balances' from API response
        const benefitBalances = (balanceData.balances || []).map((balance) => {
            console.log("🔄 Processing balance item:", balance);
            const usagePercentage = balance.usage_percentage || 0;

            let status = "high";
            if (usagePercentage >= 80) status = "low";
            else if (usagePercentage >= 50) status = "medium";

            return {
                // Fix: Use nested benefit_type.id instead of benefit_type_id
                benefit_type_id:
                    balance.benefit_type?.id || balance.benefit_type_id,
                // Fix: Use nested benefit_type.name instead of benefit_type
                benefit_type:
                    balance.benefit_type?.name || balance.benefit_type,
                initial_balance: balance.initial_balance || 0,
                current_balance: balance.current_balance || 0,
                used_amount: balance.used_amount || 0,
                usage_percentage: usagePercentage,
                status: status,
                remaining_percentage: 100 - usagePercentage,
            };
        });

        console.log("✅ Transformed benefit balances:", benefitBalances);

        const result_data = {
            employee: balanceData.employee,
            benefit_balances: benefitBalances,
            summary: balanceData.summary || {
                total_initial_balance: 0,
                total_used_amount: 0,
                total_current_balance: 0,
                overall_usage_percentage: 0,
            },
        };

        console.log("🎯 Final result:", result_data);
        return result_data;
    } catch (error) {
        console.error("Get employee benefit summary error:", error);
        throw new Error(
            error.message || "Failed to load employee benefit summary"
        );
    }
}

/**
 * Get available benefit types for employee
 */
async function getAvailableBenefitTypes(employeeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-types`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            data: result.data || [],
            total: result.pagination?.total || 0,
        };
    } catch (error) {
        console.error("Get available benefit types error:", error);
        throw new Error("Failed to load benefit types");
    }
}

/**
 * Validate claim amount against available balance
 */
async function validateClaimAmount(employeeId, benefitTypeId, amount) {
    try {
        const params = new URLSearchParams({
            employee_id: employeeId,
            benefit_type_id: benefitTypeId,
            amount: amount,
        });

        const response = await fetch(
            `${API_BASE_URL}/employee-balances/check?${params}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Authentication required. Please login.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const data = result.data || {};

        return {
            valid: data.sufficient || false,
            message:
                data.message ||
                (data.sufficient ? "Amount is valid" : "Insufficient balance"),
            current_balance: data.current_balance || 0,
            remaining_after_claim: data.remaining_after_claim || 0,
            shortage_amount: data.shortage_amount || 0,
            benefit_type: data.benefit_type || null,
        };
    } catch (error) {
        console.error("Validate claim amount error:", error);
        throw new Error(error.message || "Failed to validate claim amount");
    }
}

/**
 * Process new claim
 */
async function processNewClaim(claimData) {
    try {
        const response = await fetch(`${API_BASE_URL}/benefit-claims`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                employee_id: claimData.employee_id,
                benefit_type_id: claimData.benefit_type_id,
                amount: claimData.amount,
                description: claimData.description || "",
                claim_date: claimData.claim_date,
                status: "approved", // Claims are auto-approved
            }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Authentication required. Please login.");
            }

            // Handle validation errors
            if (response.status === 400) {
                const errorResult = await response.json();
                if (
                    errorResult.error &&
                    errorResult.error.includes("insufficient balance")
                ) {
                    const errorData = errorResult.error_data || {};
                    throw new Error(
                        `Insufficient balance. Available: Rp ${(
                            errorData.available_balance || 0
                        ).toLocaleString("id-ID")}, Requested: Rp ${(
                            errorData.requested_amount || 0
                        ).toLocaleString("id-ID")}`
                    );
                }
                throw new Error(errorResult.message || "Validation failed");
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Enhanced error handling for API response
        if (!result || !result.data) {
            throw new Error("Invalid API response: missing claim data");
        }

        // Fix variable name conflict - rename to avoid parameter collision
        const responseClaimData = result.data;

        // Validate required response fields
        if (!responseClaimData.id || !responseClaimData.claim_number) {
            throw new Error("Invalid claim response: missing required fields");
        }

        return {
            claim: {
                id: responseClaimData.id,
                claim_number: responseClaimData.claim_number,
                employee_id:
                    responseClaimData.employee_id || claimData.employee_id,
                benefit_type_id:
                    responseClaimData.benefit_type_id ||
                    claimData.benefit_type_id,
                amount: responseClaimData.amount || claimData.amount,
                description:
                    responseClaimData.description ||
                    claimData.description ||
                    "",
                claim_date:
                    responseClaimData.claim_date || claimData.claim_date,
                status: responseClaimData.status || "approved",
                processed_by: responseClaimData.created_by || null,
                processed_at:
                    responseClaimData.created_at || new Date().toISOString(),
                confirmation_number: responseClaimData.claim_number, // Use claim number as confirmation
            },
            updated_balance: result.updated_balance || 0,
            success_message: result.message || "Claim submitted successfully",
        };
    } catch (error) {
        console.error("Process new claim error:", error);
        throw new Error(error.message || "Failed to process claim");
    }
}

/**
 * Get recent claims activity
 */
async function getRecentClaimsActivity() {
    try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(
            `${API_BASE_URL}/benefit-claims?start_date=${today}&per_page=10&sort_by=created_at&sort_dir=desc`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            data: result.data || [],
            today_count: result.pagination?.total || 0,
        };
    } catch (error) {
        console.error("Get recent claims activity error:", error);
        // Return empty data on error
        return {
            data: [],
            today_count: 0,
        };
    }
}

/**
 * Get today's claims count
 */
async function getTodayClaimsCount() {
    try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(
            `${API_BASE_URL}/benefit-claims?start_date=${today}&per_page=1`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return { count: result.pagination?.total || 0 };
    } catch (error) {
        console.error("Get today's claims count error:", error);
        return { count: 0 };
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

// Utility function to calculate usage status
function getUsageStatus(usagePercentage) {
    if (usagePercentage >= 80) return "low";
    if (usagePercentage >= 50) return "medium";
    return "high";
}

// Utility function to get status color class
function getStatusColorClass(status) {
    switch (status) {
        case "approved":
            return "success";
        case "pending":
            return "warning";
        case "rejected":
            return "danger";
        default:
            return "secondary";
    }
}

/**
 * Simple login utility for testing - call this in console if needed
 * Usage: await loginForTesting('your_email', 'your_password')
 */
async function loginForTesting(email, password) {
    try {
        console.log("🔐 Attempting login for testing...");

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.data && result.data.access_token) {
            localStorage.setItem("access_token", result.data.access_token);
            console.log("✅ Login successful! Token saved to localStorage.");
            console.log("🎯 You can now use the claims processing features.");
            return result.data.access_token;
        } else {
            throw new Error("No token received from login response");
        }
    } catch (error) {
        console.error("❌ Login error:", error);
        throw new Error(`Login failed: ${error.message}`);
    }
}

// Export functions for use in other modules
window.ClaimsProcessingAPI = {
    searchEmployees,
    getEmployeeBenefitSummary,
    getAvailableBenefitTypes,
    validateClaimAmount,
    processNewClaim,
    getRecentClaimsActivity,
    getTodayClaimsCount,
    formatCurrency,
    getUsageStatus,
    getStatusColorClass,
};

// Export login function to global scope for console testing
window.loginForTesting = loginForTesting;
