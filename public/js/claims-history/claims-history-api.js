/**
 * Claims History API Integration
 *
 * API layer for claims history functionality integrating with Laravel backend
 */

// Configuration
const API_BASE_URL = "/api/v1";

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
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

/**
 * Fetch claims with pagination and filtering - Real API Implementation
 */
async function fetchClaims(filters = {}, page = 1, perPage = 10) {
    try {
        // Validate perPage to prevent backend validation error
        perPage = Math.min(Math.max(perPage, 1), 100); // Ensure between 1-100

        // Build query parameters
        const queryParams = new URLSearchParams();

        // Pagination
        queryParams.append("page", page);
        queryParams.append("per_page", perPage);

        // Filters
        if (filters.employee_id) {
            queryParams.append("employee_id", filters.employee_id);
        }

        if (filters.benefit_type_id) {
            queryParams.append("benefit_type_id", filters.benefit_type_id);
        }

        if (filters.date_from) {
            queryParams.append("start_date", filters.date_from);
        }

        if (filters.date_to) {
            queryParams.append("end_date", filters.date_to);
        }

        if (filters.min_amount) {
            queryParams.append("min_amount", filters.min_amount);
        }

        if (filters.max_amount) {
            queryParams.append("max_amount", filters.max_amount);
        }

        if (filters.search) {
            queryParams.append("search", filters.search);
        }

        if (filters.status) {
            queryParams.append("status", filters.status);
        }

        // Sorting
        if (filters.sort_by) {
            queryParams.append("sort_by", filters.sort_by);
            queryParams.append("sort_dir", filters.sort_dir || "desc");
        }

        const response = await fetch(
            `${API_BASE_URL}/benefit-claims?${queryParams}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status !== 200) {
            throw new Error(result.message || "Failed to fetch claims");
        }

        // Transform the API response to match expected format
        return {
            data: result.data.map(transformClaimData),
            pagination: result.pagination,
            summary: result.summary || null,
        };
    } catch (error) {
        console.error("Fetch claims error:", error);
        throw new Error("Failed to fetch claims data: " + error.message);
    }
}

/**
 * Transform API claim data to frontend format
 */
function transformClaimData(claim) {
    return {
        id: claim.id,
        claim_number: claim.claim_number || `CLM-${claim.id}`,
        employee_id: claim.employee?.id,
        employee_name: claim.employee?.name || "Unknown Employee",
        employee_nik: claim.employee?.nik || "",
        department: claim.employee?.department || "",
        benefit_type_id: claim.benefit_type?.id,
        benefit_type: claim.benefit_type?.name || "Unknown Benefit",
        amount: parseFloat(claim.amount) || 0,
        description: claim.description || "",
        claim_date: claim.claim_date,
        status: claim.status || "pending",
        remaining_balance: 0, // This would need separate calculation
        processed_by: claim.created_by?.name || null,
        processed_at: claim.updated_at,
        notes: claim.notes || null,
        created_at: claim.created_at,
        updated_at: claim.updated_at,
    };
}

/**
 * Get summary statistics for claims - Fixed Implementation
 * Now uses multiple API calls with proper per_page limits for comprehensive summary
 */
async function fetchClaimsSummary(filters = {}) {
    try {
        // First, get a sample of claims to calculate basic summary
        const sampleResponse = await fetchClaims(filters, 1, 100); // Use max allowed per_page
        const totalRecords = sampleResponse.pagination.total;

        let allClaims = [...sampleResponse.data];

        // If there are more than 100 records, fetch additional pages
        if (totalRecords > 100) {
            const totalPages = Math.ceil(totalRecords / 100);
            const additionalRequests = [];

            // Fetch remaining pages (up to 5 pages max to prevent too many requests)
            const maxPages = Math.min(totalPages, 5);
            for (let page = 2; page <= maxPages; page++) {
                additionalRequests.push(fetchClaims(filters, page, 100));
            }

            if (additionalRequests.length > 0) {
                const additionalResponses = await Promise.all(
                    additionalRequests
                );
                additionalResponses.forEach((response) => {
                    allClaims = allClaims.concat(response.data);
                });
            }
        }

        // Calculate summary from available data
        const totalClaims = totalRecords; // Use actual total from pagination
        const sampledClaims = allClaims.length;
        const totalAmountSampled = allClaims.reduce(
            (sum, claim) => sum + claim.amount,
            0
        );

        // Estimate total amount based on sampled data
        const averageAmountSampled =
            sampledClaims > 0 ? totalAmountSampled / sampledClaims : 0;
        const estimatedTotalAmount = averageAmountSampled * totalClaims;

        // Today's claims
        const today = new Date().toISOString().split("T")[0];
        const todayClaims = allClaims.filter(
            (claim) => claim.claim_date === today
        );

        // Status breakdown from sampled data
        const approvedClaims = allClaims.filter(
            (claim) => claim.status === "approved"
        );
        const pendingClaims = allClaims.filter(
            (claim) => claim.status === "pending"
        );
        const rejectedClaims = allClaims.filter(
            (claim) => claim.status === "rejected"
        );

        // Calculate percentages and estimate totals
        const approvedPercentage =
            sampledClaims > 0 ? approvedClaims.length / sampledClaims : 0;
        const pendingPercentage =
            sampledClaims > 0 ? pendingClaims.length / sampledClaims : 0;
        const rejectedPercentage =
            sampledClaims > 0 ? rejectedClaims.length / sampledClaims : 0;

        return {
            total_claims: totalClaims,
            total_amount:
                sampledClaims === totalClaims
                    ? totalAmountSampled
                    : estimatedTotalAmount,
            average_amount: Math.round(averageAmountSampled),
            claims_today: todayClaims.length,
            approved_claims: Math.round(approvedPercentage * totalClaims),
            pending_claims: Math.round(pendingPercentage * totalClaims),
            rejected_claims: Math.round(rejectedPercentage * totalClaims),
            approved_amount: approvedClaims.reduce(
                (sum, claim) => sum + claim.amount,
                0
            ),
            is_estimated: sampledClaims < totalClaims, // Flag to indicate if data is estimated
            sample_size: sampledClaims,
        };
    } catch (error) {
        console.error("Fetch summary error:", error);

        // Return fallback summary in case of error
        return {
            total_claims: 0,
            total_amount: 0,
            average_amount: 0,
            claims_today: 0,
            approved_claims: 0,
            pending_claims: 0,
            rejected_claims: 0,
            approved_amount: 0,
            is_estimated: false,
            sample_size: 0,
            error: error.message,
        };
    }
}

/**
 * Get summary from existing claims data - Optimized Version
 * Use this when you already have claims data to avoid additional API calls
 */
function calculateSummaryFromData(claims, totalRecords = null) {
    const totalClaims = totalRecords || claims.length;
    const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
    const averageAmount = claims.length > 0 ? totalAmount / claims.length : 0;

    // Today's claims
    const today = new Date().toISOString().split("T")[0];
    const todayClaims = claims.filter((claim) => claim.claim_date === today);

    // Status breakdown
    const approvedClaims = claims.filter(
        (claim) => claim.status === "approved"
    );
    const pendingClaims = claims.filter((claim) => claim.status === "pending");
    const rejectedClaims = claims.filter(
        (claim) => claim.status === "rejected"
    );

    return {
        total_claims: totalClaims,
        total_amount: totalAmount,
        average_amount: Math.round(averageAmount),
        claims_today: todayClaims.length,
        approved_claims: approvedClaims.length,
        pending_claims: pendingClaims.length,
        rejected_claims: rejectedClaims.length,
        approved_amount: approvedClaims.reduce(
            (sum, claim) => sum + claim.amount,
            0
        ),
        is_estimated: false,
        sample_size: claims.length,
    };
}

/**
 * Get claim details by ID - Real API Implementation
 */
async function fetchClaimDetails(claimId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/benefit-claims/${claimId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status !== 200) {
            throw new Error(result.message || "Claim not found");
        }

        return {
            ...transformClaimData(result.data),
            balance_info: result.balance_info || null,
            audit_trail: generateAuditTrail(result.data),
        };
    } catch (error) {
        console.error("Fetch claim details error:", error);
        throw new Error("Failed to fetch claim details: " + error.message);
    }
}

/**
 * Generate audit trail for a claim
 */
function generateAuditTrail(claim) {
    const trail = [
        {
            id: 1,
            action: "Claim Created",
            details: `Claim ${claim.claim_number || claim.id} was created`,
            user: claim.created_by?.name || "System",
            timestamp: claim.created_at,
        },
    ];

    if (claim.status === "approved") {
        trail.push({
            id: 2,
            action: "Claim Approved",
            details: `Claim was approved for processing`,
            user: claim.created_by?.name || "System",
            timestamp: claim.updated_at,
        });
    } else if (claim.status === "rejected") {
        trail.push({
            id: 2,
            action: "Claim Rejected",
            details: `Claim was rejected: ${
                claim.notes || "No reason provided"
            }`,
            user: claim.created_by?.name || "System",
            timestamp: claim.updated_at,
        });
    }

    return trail;
}

/**
 * Update claim (for admin actions) - Real API Implementation
 */
async function updateClaim(claimId, updateData) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/benefit-claims/${claimId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status !== 200) {
            throw new Error(result.message || "Failed to update claim");
        }

        return transformClaimData(result.data);
    } catch (error) {
        console.error("Update claim error:", error);
        throw new Error("Failed to update claim: " + error.message);
    }
}

/**
 * Export claims functionality - Real API Implementation
 */
async function exportClaims(filters = {}, format = "excel") {
    try {
        // Build query parameters for export
        const queryParams = new URLSearchParams();

        // Add all filters
        Object.keys(filters).forEach((key) => {
            if (
                filters[key] !== null &&
                filters[key] !== undefined &&
                filters[key] !== ""
            ) {
                queryParams.append(key, filters[key]);
            }
        });

        const response = await fetch(
            `${API_BASE_URL}/benefit-claims/export?${queryParams}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is JSON (error) or blob (file)
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            if (result.status !== 200) {
                throw new Error(result.message || "Failed to export claims");
            }
            return result;
        } else {
            // Handle blob response for file download
            const blob = await response.blob();
            const filename =
                getFilenameFromResponse(response) || "claims-export.xlsx";

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return { success: true, message: "Export downloaded successfully" };
        }
    } catch (error) {
        console.error("Export claims error:", error);
        throw new Error("Failed to export claims: " + error.message);
    }
}

/**
 * Extract filename from response headers
 */
function getFilenameFromResponse(response) {
    const disposition = response.headers.get("Content-Disposition");
    console.log("Content-Disposition header:", disposition); // Debug log

    if (disposition && disposition.includes("filename=")) {
        // Try multiple patterns to parse filename
        let filenameMatch = disposition.match(/filename="(.+?)"/);
        if (!filenameMatch) {
            // Try without quotes
            filenameMatch = disposition.match(/filename=([^;]+)/);
        }
        if (!filenameMatch) {
            // Try filename* format (RFC 5987)
            filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/);
            if (filenameMatch) {
                return decodeURIComponent(filenameMatch[1]);
            }
        }
        if (filenameMatch && filenameMatch[1]) {
            const filename = filenameMatch[1].trim();
            console.log("Extracted filename:", filename); // Debug log
            return filename;
        }
    }
    console.log("No filename found in headers, using fallback"); // Debug log
    return null;
}

/**
 * Get filter options (employees, benefit types) - Real API Implementation
 */
async function fetchFilterOptions() {
    try {
        // Fetch employees and benefit types from their respective endpoints
        const [employeesResponse, benefitTypesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/employees`, {
                method: "GET",
                headers: getAuthHeaders(),
            }),
            fetch(`${API_BASE_URL}/benefit-types`, {
                method: "GET",
                headers: getAuthHeaders(),
            }),
        ]);

        if (!employeesResponse.ok || !benefitTypesResponse.ok) {
            throw new Error("Failed to fetch filter options");
        }

        const [employeesResult, benefitTypesResult] = await Promise.all([
            employeesResponse.json(),
            benefitTypesResponse.json(),
        ]);

        return {
            employees: employeesResult.data || [],
            benefit_types: benefitTypesResult.data || [],
            status_options: [
                { value: "approved", label: "Approved" },
                { value: "pending", label: "Pending" },
                { value: "rejected", label: "Rejected" },
                { value: "processing", label: "Processing" },
            ],
        };
    } catch (error) {
        console.error("Fetch filter options error:", error);
        throw new Error("Failed to fetch filter options: " + error.message);
    }
}

/**
 * Utility Functions
 */
function formatCurrency(amount) {
    // Handle invalid values gracefully
    const numericAmount = parseFloat(amount);
    if (
        isNaN(numericAmount) ||
        numericAmount === null ||
        numericAmount === undefined
    ) {
        return "Rp 0";
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericAmount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("id-ID");
}

function getStatusColorClass(status) {
    const statusColors = {
        approved: "success",
        pending: "warning",
        rejected: "danger",
        processing: "info",
    };
    return statusColors[status] || "secondary";
}

// Export functions for use in other modules
window.ClaimsHistoryAPI = {
    fetchClaims,
    fetchClaimsSummary,
    fetchClaimDetails,
    updateClaim,
    exportClaims,
    fetchFilterOptions,
    formatCurrency,
    formatDate,
    getStatusColorClass,
};
