/**
 * Claims History Main JavaScript
 *
 * Handles claims history page functionality including:
 * - Loading and displaying claims data
 * - Filtering and searching
 * - Pagination
 * - Summary cards
 * - Export functionality
 */

class ClaimsHistoryManager {
    constructor() {
        this.currentPage = 1;
        this.perPage = 10;
        this.currentFilters = {};
        this.currentSort = {
            field: "claim_date",
            direction: "desc",
        };
        this.isLoading = false;
        this.lastClaimsResponse = null; // Cache last response to avoid duplicate calls

        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
    }

    initializeElements() {
        // Filter elements
        this.dateFromFilter = document.getElementById("dateFromFilter");
        this.dateToFilter = document.getElementById("dateToFilter");
        this.employeeFilter = document.getElementById("employeeFilter");
        this.benefitTypeFilter = document.getElementById("benefitTypeFilter");
        this.minAmountFilter = document.getElementById("minAmountFilter");
        this.maxAmountFilter = document.getElementById("maxAmountFilter");
        this.statusFilter = document.getElementById("statusFilter");
        this.searchInput = document.getElementById("searchInput");

        // Filter action buttons
        this.applyFiltersBtn = document.getElementById("applyFiltersBtn");
        this.resetFiltersBtn = document.getElementById("resetFiltersBtn");
        this.clearAllFiltersBtn = document.getElementById("clearAllFiltersBtn");

        // Quick filter buttons
        this.quickFilterBtns = document.querySelectorAll("[data-filter]");

        // Export button
        this.exportBtn = document.getElementById("exportBtn");

        // Table and pagination elements
        this.claimsTable = document.querySelector(".claims-table tbody");
        this.summaryCards = document.getElementById("summaryCards");
        this.paginationContainer = document.querySelector(
            ".pagination-container"
        );

        // Create pagination container if it doesn't exist
        if (!this.paginationContainer) {
            this.paginationContainer = document.createElement("div");
            this.paginationContainer.className = "pagination-container mt-3";
            this.claimsTable.parentElement.parentElement.appendChild(
                this.paginationContainer
            );
        }
    }

    attachEventListeners() {
        // Filter buttons
        this.applyFiltersBtn?.addEventListener("click", () =>
            this.applyFilters()
        );
        this.resetFiltersBtn?.addEventListener("click", () =>
            this.resetFilters()
        );
        this.clearAllFiltersBtn?.addEventListener("click", () =>
            this.clearAllFilters()
        );

        // Quick filters
        this.quickFilterBtns.forEach((btn) => {
            btn.addEventListener("click", (e) =>
                this.applyQuickFilter(e.target.dataset.filter)
            );
        });

        // Search input with debounce
        this.searchInput?.addEventListener(
            "input",
            this.debounce(() => {
                this.applyFilters();
            }, 500)
        );

        // Export button
        this.exportBtn?.addEventListener("click", () => this.exportClaims());

        // Table sorting
        this.attachSortingListeners();
    }

    attachSortingListeners() {
        const sortableHeaders = document.querySelectorAll("th[data-sort]");
        sortableHeaders.forEach((header) => {
            header.addEventListener("click", () => {
                const field = header.dataset.sort;
                const currentDirection =
                    this.currentSort.field === field
                        ? this.currentSort.direction
                        : "desc";
                const newDirection =
                    currentDirection === "asc" ? "desc" : "asc";

                this.sortBy(field, newDirection);
                this.updateSortIndicators(field, newDirection);
            });
        });
    }

    updateSortIndicators(field, direction) {
        // Reset all sort indicators
        document
            .querySelectorAll("th[data-sort] .sort-icon")
            .forEach((icon) => {
                icon.className = "bi bi-arrow-up-down sort-icon";
            });

        // Set active sort indicator
        const activeHeader = document.querySelector(
            `th[data-sort="${field}"] .sort-icon`
        );
        if (activeHeader) {
            activeHeader.className =
                direction === "asc"
                    ? "bi bi-arrow-up sort-icon active"
                    : "bi bi-arrow-down sort-icon active";
        }
    }

    async loadInitialData() {
        this.showLoading();

        try {
            // Load filter options first
            await this.loadFilterOptions();

            // Load claims data and extract summary from response
            await this.loadClaimsDataWithSummary();
        } catch (error) {
            console.error("Failed to load initial data:", error);
            this.showError(
                "Failed to load claims data. Please refresh the page."
            );
        } finally {
            this.hideLoading();
        }
    }

    async loadFilterOptions() {
        try {
            const options = await fetchFilterOptions();

            // Populate employee dropdown
            if (this.employeeFilter && options.employees) {
                this.populateSelectOptions(
                    this.employeeFilter,
                    options.employees,
                    "id",
                    "name"
                );
            }

            // Populate benefit type dropdown
            if (this.benefitTypeFilter && options.benefit_types) {
                this.populateSelectOptions(
                    this.benefitTypeFilter,
                    options.benefit_types,
                    "id",
                    "name"
                );
            }

            // Populate status dropdown (if not already populated)
            if (this.statusFilter && options.status_options) {
                this.populateSelectOptions(
                    this.statusFilter,
                    options.status_options,
                    "value",
                    "label"
                );
            }
        } catch (error) {
            console.error("Failed to load filter options:", error);
        }
    }

    populateSelectOptions(selectElement, options, valueField, textField) {
        // Clear existing options except the first (default) one
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }

        // Add new options
        options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option[valueField];
            optionElement.textContent = option[textField];
            selectElement.appendChild(optionElement);
        });
    }

    async loadClaimsData() {
        try {
            this.showTableLoading();

            const response = await fetchClaims(
                this.buildFiltersObject(),
                this.currentPage,
                this.perPage
            );

            this.lastClaimsResponse = response; // Cache the response
            this.renderClaimsTable(response.data);
            this.renderPagination(response.pagination);
        } catch (error) {
            console.error("Failed to load claims:", error);
            this.showTableError("Failed to load claims data");
        }
    }

    async loadClaimsDataWithSummary() {
        try {
            this.showTableLoading();

            const response = await fetchClaims(
                this.buildFiltersObject(),
                this.currentPage,
                this.perPage
            );

            this.lastClaimsResponse = response; // Cache the response
            this.renderClaimsTable(response.data);
            this.renderPagination(response.pagination);

            // Use summary from API response if available, otherwise calculate it
            if (response.summary) {
                // Normalize backend summary to match frontend expectations
                const normalizedSummary = {
                    ...response.summary,
                    average_amount:
                        response.summary.average_claim_amount ||
                        response.summary.average_amount ||
                        0,
                    claims_today:
                        response.summary.claims_today ||
                        this.calculateTodaysClaims(response.data),
                };
                this.renderSummaryCards(normalizedSummary);
            } else {
                // Calculate summary from loaded data and pagination info
                const summary = calculateSummaryFromData(
                    response.data,
                    response.pagination.total
                );
                this.renderSummaryCards(summary);
            }
        } catch (error) {
            console.error("Failed to load claims:", error);
            this.showTableError("Failed to load claims data");
        }
    }

    async loadSummary() {
        try {
            // Use cached response summary if available and filters haven't changed
            if (this.lastClaimsResponse && this.lastClaimsResponse.summary) {
                this.renderSummaryCards(this.lastClaimsResponse.summary);
                return;
            }

            // Otherwise fetch new summary
            const summary = await fetchClaimsSummary(this.buildFiltersObject());
            this.renderSummaryCards(summary);
        } catch (error) {
            console.error("Failed to load summary:", error);
            // Show a basic summary based on visible data as fallback
            if (this.lastClaimsResponse) {
                const fallbackSummary = calculateSummaryFromData(
                    this.lastClaimsResponse.data,
                    this.lastClaimsResponse.pagination.total
                );
                this.renderSummaryCards(fallbackSummary);
            }
        }
    }

    buildFiltersObject() {
        const filters = { ...this.currentFilters };

        // Add sorting
        filters.sort_by = this.currentSort.field;
        filters.sort_dir = this.currentSort.direction;

        return filters;
    }

    applyFilters() {
        this.currentFilters = {
            date_from: this.dateFromFilter?.value || null,
            date_to: this.dateToFilter?.value || null,
            employee_id: this.employeeFilter?.value || null,
            benefit_type_id: this.benefitTypeFilter?.value || null,
            min_amount: this.minAmountFilter?.value || null,
            max_amount: this.maxAmountFilter?.value || null,
            status: this.statusFilter?.value || null,
            search: this.searchInput?.value || null,
        };

        // Remove null/empty values
        Object.keys(this.currentFilters).forEach((key) => {
            if (!this.currentFilters[key]) {
                delete this.currentFilters[key];
            }
        });

        this.currentPage = 1; // Reset to first page
        this.lastClaimsResponse = null; // Clear cache since filters changed
        this.loadClaimsDataWithSummary(); // Load both claims and summary
    }

    resetFilters() {
        // Clear all filter inputs
        this.dateFromFilter && (this.dateFromFilter.value = "");
        this.dateToFilter && (this.dateToFilter.value = "");
        this.employeeFilter && (this.employeeFilter.value = "");
        this.benefitTypeFilter && (this.benefitTypeFilter.value = "");
        this.minAmountFilter && (this.minAmountFilter.value = "");
        this.maxAmountFilter && (this.maxAmountFilter.value = "");
        this.statusFilter && (this.statusFilter.value = "");
        this.searchInput && (this.searchInput.value = "");

        this.applyFilters();
    }

    clearAllFilters() {
        this.resetFilters();
    }

    applyQuickFilter(filterType) {
        const today = new Date();
        let startDate, endDate;

        switch (filterType) {
            case "today":
                startDate = endDate = this.formatDate(today);
                break;
            case "week":
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                startDate = this.formatDate(weekStart);
                endDate = this.formatDate(today);
                break;
            case "month":
                const monthStart = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );
                startDate = this.formatDate(monthStart);
                endDate = this.formatDate(today);
                break;
            default:
                return;
        }

        if (this.dateFromFilter) this.dateFromFilter.value = startDate;
        if (this.dateToFilter) this.dateToFilter.value = endDate;

        this.applyFilters();
    }

    sortBy(field, direction) {
        this.currentSort = { field, direction };
        this.lastClaimsResponse = null; // Clear cache since sort changed
        this.loadClaimsData();
    }

    changePage(page) {
        this.currentPage = page;
        this.loadClaimsData(); // Only load claims data, summary doesn't change with pagination
    }

    renderClaimsTable(claims) {
        if (!this.claimsTable) return;

        if (claims.length === 0) {
            this.claimsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="no-data">
                            <i class="bi bi-inbox display-4 text-muted"></i>
                            <p class="mt-2 text-muted">No claims found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.claimsTable.innerHTML = claims
            .map(
                (claim) => `
            <tr>
                <td>${formatDate(claim.claim_date)}</td>
                <td>
                    <div class="employee-info">
                        <strong>${claim.employee_name}</strong>
                        <small class="d-block text-muted">${
                            claim.employee_nik
                        }</small>
                    </div>
                </td>
                <td>${claim.department}</td>
                <td>${claim.benefit_type}</td>
                <td class="text-end">${formatCurrency(claim.amount)}</td>
                <td>
                    <span class="badge bg-${getStatusColorClass(claim.status)}">
                        ${
                            claim.status.charAt(0).toUpperCase() +
                            claim.status.slice(1)
                        }
                    </span>
                </td>
            </tr>
        `
            )
            .join("");
    }

    renderSummaryCards(summary) {
        if (!this.summaryCards) return;

        this.summaryCards.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card stats-card success">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Total Claims</h6>
                                    <h3 class="mb-0">${(
                                        summary.total_claims ?? 0
                                    ).toLocaleString()}</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-file-text"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card primary">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Total Amount</h6>
                                    <h3 class="mb-0">${formatCurrency(
                                        summary.total_amount ?? 0
                                    )}</h3>
                                    ${
                                        summary.is_estimated
                                            ? '<small class="text-muted">*Estimated</small>'
                                            : ""
                                    }
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-cash-coin"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card warning">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Average Amount</h6>
                                    <h3 class="mb-0">${formatCurrency(
                                        summary.average_amount ?? 0
                                    )}</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-graph-up"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card info">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Today's Claims</h6>
                                    <h3 class="mb-0">${
                                        summary.claims_today ?? 0
                                    }</h3>
                                </div>
                                <div class="stats-icon">
                                    <i class="bi bi-calendar-day"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${
                summary.approved_claims !== undefined
                    ? `
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="card stats-card-sm success">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-1">Approved</h6>
                            <h4 class="mb-0">${
                                summary.approved_claims ?? 0
                            }</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stats-card-sm warning">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-1">Pending</h6>
                            <h4 class="mb-0">${summary.pending_claims ?? 0}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stats-card-sm danger">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-1">Rejected</h6>
                            <h4 class="mb-0">${
                                summary.rejected_claims ?? 0
                            }</h4>
                        </div>
                    </div>
                </div>
            </div>
            `
                    : ""
            }
            
            ${
                summary.error
                    ? `
            <div class="alert alert-warning mt-3">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Summary data may be incomplete due to an error: ${summary.error}
            </div>
            `
                    : ""
            }
        `;
    }

    renderPagination(pagination) {
        if (!this.paginationContainer || !pagination) return;

        const { current_page, last_page, total } = pagination;

        if (last_page <= 1) {
            this.paginationContainer.innerHTML = "";
            return;
        }

        let paginationHTML = `
            <nav aria-label="Claims pagination">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${
                        current_page === 1 ? "disabled" : ""
                    }">
                        <a class="page-link" href="#" data-page="${
                            current_page - 1
                        }" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
        `;

        // Calculate page range to show
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(last_page, current_page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === current_page ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${
                        current_page === last_page ? "disabled" : ""
                    }">
                        <a class="page-link" href="#" data-page="${
                            current_page + 1
                        }" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="text-center mt-2">
                <small class="text-muted">
                    Showing ${pagination.from} to ${
            pagination.to
        } of ${total} results
                </small>
            </div>
        `;

        this.paginationContainer.innerHTML = paginationHTML;

        // Attach click handlers to pagination links
        this.paginationContainer
            .querySelectorAll("a[data-page]")
            .forEach((link) => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page);
                    if (page > 0 && page <= last_page) {
                        this.changePage(page);
                    }
                });
            });
    }

    async exportClaims() {
        try {
            // Show loading state
            this.showExportLoading(true);

            // Always use current filters (whatever state the table is in)
            const filters = this.buildFiltersObject();
            const result = await exportClaims(filters, "excel");

            // Handle the export result
            if (result.success) {
                this.showExportSuccessModal(
                    "Excel file downloaded successfully!"
                );
            } else if (result.download_url) {
                window.open(result.download_url, "_blank");
                this.showExportSuccessModal("Export completed successfully.");
            } else {
                this.showExportSuccessModal("Export completed successfully.");
            }
        } catch (error) {
            console.error("Export failed:", error);
            this.showExportErrorModal(
                "Export failed. Please try again.",
                error.message
            );
        } finally {
            this.showExportLoading(false);
        }
    }

    // Utility methods
    calculateTodaysClaims(claims) {
        if (!claims || !Array.isArray(claims)) return 0;

        const today = new Date().toISOString().split("T")[0];
        return claims.filter((claim) => claim.claim_date === today).length;
    }

    formatDate(date) {
        return date.toISOString().split("T")[0];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading() {
        this.isLoading = true;
        // You can add a global loading indicator here
    }

    hideLoading() {
        this.isLoading = false;
        // Hide global loading indicator
    }

    showTableLoading() {
        if (this.claimsTable) {
            this.claimsTable.innerHTML = `
                <tr>
                    <td colspan="${this.getTableColumnCount()}" class="text-center py-4">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 text-muted">Loading claims...</p>
                    </td>
                </tr>
            `;
        }
    }

    showTableError(message) {
        if (this.claimsTable) {
            this.claimsTable.innerHTML = `
                <tr>
                    <td colspan="${this.getTableColumnCount()}" class="text-center py-4">
                        <div class="text-danger">
                            <i class="bi bi-exclamation-triangle display-4"></i>
                            <p class="mt-2">${message}</p>
                            <button class="btn btn-outline-primary btn-sm" onclick="claimsManager.loadClaimsData()">
                                Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        console.error(message);
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: message,
                confirmButtonColor: "#dc3545",
                confirmButtonText: "OK",
            });
        } else {
            alert(message); // Fallback
        }
    }

    showSuccess(message) {
        console.log(message);
        if (typeof Swal !== "undefined") {
            Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                },
            }).fire({
                icon: "success",
                title: message,
            });
        } else {
            alert(message); // Fallback
        }
    }

    showExportLoading(show = true) {
        const exportBtn = this.exportBtn;
        if (!exportBtn) return;

        if (show) {
            exportBtn.disabled = true;
            exportBtn.innerHTML =
                '<i class="spinner-border spinner-border-sm me-1"></i>Exporting...';
        } else {
            exportBtn.disabled = false;
            exportBtn.innerHTML =
                '<i class="bi bi-file-earmark-arrow-down me-1"></i>Export';
        }
    }

    showExportSuccessModal(message) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "success",
                title: "Export Successful!",
                html: `
                    <div class="text-center">
                        <div class="mb-3">
                            <i class="bi bi-file-earmark-check text-success" style="font-size: 3rem;"></i>
                        </div>
                        <p class="mb-3">${message}</p>
                        <div class="d-flex justify-content-center gap-2">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                File saved in your Downloads folder
                            </small>
                        </div>
                    </div>
                `,
                confirmButtonText: "Great!",
                confirmButtonColor: "#198754",
                backdrop: true,
                allowOutsideClick: true,
                showClass: {
                    popup: "animate__animated animate__zoomIn animate__faster",
                },
                hideClass: {
                    popup: "animate__animated animate__zoomOut animate__faster",
                },
            });
        } else {
            alert(message); // Fallback
        }
    }

    showExportErrorModal(message, details = null) {
        if (typeof Swal !== "undefined") {
            let content = `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                    </div>
                    <p class="mb-3">${message}</p>
            `;

            if (details) {
                content += `
                    <div class="accordion" id="errorDetailsAccordion">
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#errorDetails">
                                    <i class="bi bi-bug me-2"></i>Technical Details
                                </button>
                            </h2>
                            <div id="errorDetails" class="accordion-collapse collapse" data-bs-parent="#errorDetailsAccordion">
                                <div class="accordion-body text-start">
                                    <small class="text-muted font-monospace">${details}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            content += `
                    <div class="mt-3">
                        <small class="text-muted">
                            <i class="bi bi-arrow-clockwise me-1"></i>
                            Please try again or contact support if the problem persists.
                        </small>
                    </div>
                </div>
            `;

            Swal.fire({
                icon: "error",
                title: "Export Failed",
                html: content,
                confirmButtonText: "Try Again",
                confirmButtonColor: "#dc3545",
                showCancelButton: true,
                cancelButtonText: "Cancel",
                backdrop: true,
                allowOutsideClick: true,
                showClass: {
                    popup: "animate__animated animate__shakeX animate__faster",
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    // Retry export
                    this.exportClaims();
                }
            });
        } else {
            alert(message); // Fallback
        }
    }

    /**
     * Get the number of columns in the claims table dynamically
     */
    getTableColumnCount() {
        const tableHeaders = document.querySelectorAll(
            ".claims-table thead th"
        );
        return tableHeaders.length || 6; // Fallback to 6 if headers not found
    }
}

// Global functions for table actions
window.viewClaimDetails = async function (claimId) {
    try {
        const claim = await fetchClaimDetails(claimId);
        // You can implement a modal to show claim details
        console.log("Claim details:", claim);
        alert(
            `Claim Details:\nID: ${claim.id}\nEmployee: ${
                claim.employee_name
            }\nAmount: ${formatCurrency(claim.amount)}\nStatus: ${claim.status}`
        );
    } catch (error) {
        console.error("Failed to load claim details:", error);
        alert("Failed to load claim details");
    }
};

window.editClaim = function (claimId) {
    // Redirect to edit page or open edit modal
    window.location.href = `/dashboard/claims-processing?edit=${claimId}`;
};

// Initialize the claims history manager when the page loads
let claimsManager;
document.addEventListener("DOMContentLoaded", function () {
    claimsManager = new ClaimsHistoryManager();
});
