/**
 * Employee Benefit Balances - Main JS
 *
 * Main JavaScript for the Employee Benefit Balances page
 */

document.addEventListener("DOMContentLoaded", function () {
    // Initialize variables
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentFilters = {
        employeeId: "",
        benefitTypeId: "",
        year: new Date().getFullYear(),
        searchQuery: "",
    };
    let isProcessing = false;
    let modalHandlersInitialized = false;
    let allEmployeesData = []; // Store all employees data for search
    let isEmployeesLoaded = false; // Track if employees are fully loaded
    let isSelect2Initialized = false; // Track if Select2 is fully initialized
    let employeeDepartmentsMap = {}; // Store employee ID -> department mapping

    // DOM elements
    const employeeFilter = document.getElementById("employeeFilter");
    const benefitTypeFilter = document.getElementById("benefitTypeFilter");
    const yearFilter = document.getElementById("yearFilter");
    const searchInput = document.getElementById("searchInput");
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const balanceTable = document.querySelector(".balance-table tbody");
    const paginationInfo = document.querySelector(".pagination-info");
    const perPageSelect = document.querySelector(".per-page-select");
    const prevPageBtn = document.querySelector(
        ".pagination-buttons button:first-child"
    );
    const nextPageBtn = document.querySelector(
        ".pagination-buttons button:last-child"
    );
    const initializeBalancesBtn = document.querySelector(
        ".initialize-balances-btn"
    );
    const exportDataBtn = document.querySelector(".export-data-btn");
    const summaryCards = document.querySelector(".summary-cards");

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize page
    initializePage();

    /**
     * Load employee departments mapping
     */
    async function loadEmployeeDepartments() {
        try {
            console.log("Loading employee departments mapping...");
            employeeDepartmentsMap =
                await BenefitBalancesApi.fetchEmployeesWithDepartments();
            console.log("Employee departments mapping loaded successfully");
        } catch (error) {
            console.error("Error loading employee departments:", error);
            // Continue without departments mapping to avoid breaking the page
            employeeDepartmentsMap = {};
        }
    }

    // Event listeners
    applyFiltersBtn.addEventListener("click", function () {
        // Show loading state
        this.disabled = true;
        this.innerHTML =
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Applying...';

        // Reset to first page
        currentPage = 1;

        // Update filters
        currentFilters = {
            employeeId: employeeFilter.value,
            benefitTypeId: benefitTypeFilter.value,
            year: yearFilter.value,
            searchQuery: searchInput.value.trim(),
        };

        // Load data with new filters
        loadData()
            .then(() => {
                updateSummaryStatistics();

                // Reset button state
                this.disabled = false;
                this.innerHTML =
                    '<i class="bi bi-funnel me-2"></i>Apply Filters';

                // Show success notification
                showNotification("Filters applied successfully", "success");
            })
            .catch((error) => {
                console.error("Error applying filters:", error);

                // Reset button state
                this.disabled = false;
                this.innerHTML =
                    '<i class="bi bi-funnel me-2"></i>Apply Filters';

                showNotification(
                    "Error applying filters: " + error.message,
                    "error"
                );
            });
    });

    clearFiltersBtn.addEventListener("click", function () {
        // Reset filters
        employeeFilter.value = "";
        benefitTypeFilter.value = "";
        yearFilter.value = new Date().getFullYear();
        searchInput.value = "";

        // Reset current filters
        currentFilters = {
            employeeId: "",
            benefitTypeId: "",
            year: new Date().getFullYear(),
            searchQuery: "",
        };

        // Reset to first page
        currentPage = 1;

        // Reload data
        loadData()
            .then(() => {
                updateSummaryStatistics();
                showNotification("Filters cleared", "info");
            })
            .catch((error) => {
                console.error("Error clearing filters:", error);
                showNotification(
                    "Error clearing filters: " + error.message,
                    "error"
                );
            });
    });

    perPageSelect.addEventListener("change", function () {
        // Update items per page
        itemsPerPage = parseInt(this.value);

        // Reset to first page
        currentPage = 1;

        // Reload data
        loadData().catch((error) => {
            console.error("Error changing page size:", error);
            showNotification("Error loading data: " + error.message, "error");
        });
    });

    prevPageBtn.addEventListener("click", function () {
        // Check if button is disabled before proceeding
        if (
            !this.disabled &&
            !this.classList.contains("disabled") &&
            currentPage > 1
        ) {
            console.log(`Navigating to previous page: ${currentPage - 1}`);
            currentPage--;
            loadData().catch((error) => {
                console.error("Error loading previous page:", error);
                showNotification(
                    "Error loading page: " + error.message,
                    "error"
                );
                // Revert page if failed
                currentPage++;
            });
        } else {
            console.log(
                "Previous button clicked but disabled or on first page"
            );
        }
    });

    nextPageBtn.addEventListener("click", function () {
        // Check if button is disabled before proceeding
        if (!this.disabled && !this.classList.contains("disabled")) {
            console.log(`Navigating to next page: ${currentPage + 1}`);
            currentPage++;
            loadData().catch((error) => {
                console.error("Error loading next page:", error);
                showNotification(
                    "Error loading page: " + error.message,
                    "error"
                );
                // Revert page if failed
                currentPage--;
            });
        } else {
            console.log("Next button clicked but disabled or on last page");
        }
    });

    initializeBalancesBtn.addEventListener("click", function () {
        showInitializeBalancesModal();
    });

    exportDataBtn.addEventListener("click", function () {
        exportData();
    });

    // Implement search input with debounce
    let searchTimeout;
    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.searchQuery = this.value.trim();
            currentPage = 1;
            loadData()
                .then(() => {
                    updateSummaryStatistics();
                })
                .catch((error) => {
                    console.error("Error searching:", error);
                    showNotification(
                        "Error searching: " + error.message,
                        "error"
                    );
                });
        }, 300); // 300ms debounce
    });

    // Functions
    async function initializePage() {
        try {
            // Load employee departments mapping and populate dropdowns concurrently
            await Promise.all([
                loadEmployeeDepartments(), // Load employee departments mapping first
                populateEmployeeDropdown(),
                populateBenefitTypeDropdown(),
                populateYearDropdown(),
            ]);

            // Load initial data
            await loadData();
            await updateSummaryStatistics();
        } catch (error) {
            // Only show error notification for real errors, not empty state
            if (
                !error.message
                    .toLowerCase()
                    .includes("no employee benefit balances found")
            ) {
                console.error("Error initializing page:", error);
                showNotification(
                    "Error loading page data: " + error.message,
                    "error"
                );
            } else {
                console.log("Page initialized with empty data state");
            }
        }
    }

    async function populateEmployeeDropdown() {
        try {
            // Clear existing options except the first one
            while (employeeFilter.options.length > 1) {
                employeeFilter.remove(1);
            }

            const employees = await fetchEmployees();

            employees.forEach((employee) => {
                const option = document.createElement("option");
                option.value = employee.id;
                option.textContent = `${employee.name} (${
                    employee.nik || employee.employee_id || "N/A"
                })${employee.department ? " - " + employee.department : ""}`;
                employeeFilter.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading employees:", error);
            // Don't throw error to prevent breaking the whole page
        }
    }

    async function populateBenefitTypeDropdown() {
        try {
            // Clear existing options except the first one
            while (benefitTypeFilter.options.length > 1) {
                benefitTypeFilter.remove(1);
            }

            const benefitTypes = await fetchBenefitTypes();

            benefitTypes.forEach((type) => {
                const option = document.createElement("option");
                option.value = type.id;
                option.textContent = type.name;
                benefitTypeFilter.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading benefit types:", error);
            // Don't throw error to prevent breaking the whole page
        }
    }

    function populateYearDropdown() {
        // Clear existing options
        yearFilter.innerHTML = "";

        // Get current year
        const currentYear = new Date().getFullYear();

        // Add years (current year ± 5 years)
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;

            // Set current year as default selected
            if (year === currentYear) {
                option.selected = true;
            }

            yearFilter.appendChild(option);
        }
    }

    async function loadData() {
        // Show loading state
        balanceTable.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading benefit balances...</p>
                </td>
            </tr>
        `;

        try {
            // Get paginated data with filters from API
            const response = await fetchBenefitBalances(
                currentPage,
                itemsPerPage,
                currentFilters
            );

            // Update current page from API response to ensure consistency
            if (response.pagination && response.pagination.current_page) {
                currentPage = response.pagination.current_page;
            }

            // Update pagination state
            updatePaginationState(response.pagination);

            // Render table data with empty state handling
            renderTableData(response.data, response.isEmpty);
        } catch (error) {
            console.error("Error loading data:", error);

            // Show error state only for real errors, not empty data
            balanceTable.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="bi bi-exclamation-triangle text-danger" style="font-size: 2rem;"></i>
                        <p class="mt-2 text-danger">Error loading benefit balances: ${error.message}</p>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Retry
                        </button>
                    </td>
                </tr>
            `;

            throw error; // Re-throw for parent error handling
        }
    }

    function renderTableData(data, isEmpty = false) {
        // Clear table
        balanceTable.innerHTML = "";

        // Check if data is empty
        if (!data || data.length === 0) {
            // Create different empty state based on whether it's truly empty or filtered
            const hasActiveFilters =
                currentFilters.employeeId ||
                currentFilters.benefitTypeId ||
                currentFilters.year !== new Date().getFullYear() ||
                currentFilters.searchQuery;

            if (isEmpty && !hasActiveFilters) {
                // Truly empty state - no data exists yet
                balanceTable.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-5">
                            <div class="empty-state">
                                <i class="bi bi-inbox text-muted" style="font-size: 4rem;"></i>
                                <h5 class="mt-3 text-muted">No Benefit Balances Yet</h5>
                                <p class="text-muted mb-4">
                                    It looks like no employee benefit balances have been initialized yet.<br>
                                    Start by initializing balances for employees.
                                </p>
                                <button class="btn btn-primary" onclick="document.querySelector('.initialize-balances-btn').click()">
                                    <i class="bi bi-plus-circle me-2"></i>Initialize Benefit Balances
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                // Filtered empty state - no data matching current filters
                balanceTable.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <div class="filtered-empty-state">
                                <i class="bi bi-funnel text-muted" style="font-size: 3rem;"></i>
                                <h6 class="mt-3 text-muted">No Results Found</h6>
                                <p class="text-muted mb-3">
                                    No benefit balances match your current filters.
                                </p>
                                <button class="btn btn-sm btn-outline-primary" id="resetFiltersBtn">
                                    <i class="bi bi-arrow-counterclockwise me-1"></i>Reset Filters
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

                // Add event listener to reset button
                document
                    .getElementById("resetFiltersBtn")
                    ?.addEventListener("click", function () {
                        clearFiltersBtn.click();
                    });
            }

            return;
        }

        // Add data rows
        data.forEach((balance) => {
            const row = document.createElement("tr");

            // Extract data from API response format
            const employee = balance.employee || {};
            const benefitBudget = balance.benefit_budget || {};
            const benefitType = benefitBudget.benefit_type || {};

            // Get department from mapping using employee ID
            const employeeId = employee.id || balance.employee_id;
            const departmentFromMapping =
                employeeDepartmentsMap[employeeId]?.department;
            const department =
                departmentFromMapping || employee.department || "N/A";

            const initialBalance = parseFloat(benefitBudget.budget || 0);
            const currentBalance = parseFloat(balance.current_balance || 0);
            const usageAmount = initialBalance - currentBalance;
            const usagePercentage =
                initialBalance > 0
                    ? Math.round((usageAmount / initialBalance) * 100)
                    : 0;

            // Create row cells
            row.innerHTML = `
                <td>
                    <div class="employee-info">
                        <div class="employee-name">${
                            employee.name || "N/A"
                        }</div>
                        <div class="employee-nik">${employee.nik || "N/A"}</div>
                    </div>
                </td>
                <td>${department}</td>
                <td>${benefitType.name || "N/A"}</td>
                <td>${benefitBudget.year || "N/A"}</td>
                <td>${formatCurrency(initialBalance)}</td>
                <td>${formatCurrency(currentBalance)}</td>
                <td class="balance-indicator-cell"></td>
                <td>${formatDate(balance.updated_at || balance.created_at)}</td>
            `;

            // Add balance visualization
            const balanceCell = row.querySelector(".balance-indicator-cell");
            balanceCell.appendChild(
                createBalanceProgressBar(
                    currentBalance,
                    initialBalance,
                    usagePercentage
                )
            );

            // Add the row to table
            balanceTable.appendChild(row);
        });
    }

    function updatePaginationState(pagination) {
        // Update pagination info text
        const from = pagination.from || 0;
        const to = pagination.to || 0;
        const total = pagination.total || 0;
        const currentPage = pagination.current_page || 1;
        const lastPage = pagination.last_page || 1;

        paginationInfo.textContent = `Showing ${from} to ${to} of ${total} entries`;

        // Update pagination buttons state based on API response structure
        // Disable Previous button if we're on the first page
        if (currentPage <= 1) {
            prevPageBtn.disabled = true;
            prevPageBtn.classList.add("disabled");
        } else {
            prevPageBtn.disabled = false;
            prevPageBtn.classList.remove("disabled");
        }

        // Disable Next button if we're on the last page or if there's no next page
        if (currentPage >= lastPage) {
            nextPageBtn.disabled = true;
            nextPageBtn.classList.add("disabled");
        } else {
            nextPageBtn.disabled = false;
            nextPageBtn.classList.remove("disabled");
        }

        // Update per page select
        if (perPageSelect) {
            perPageSelect.value = pagination.per_page || itemsPerPage;
        }

        // Log pagination state for debugging
        console.log("Pagination state updated:", {
            currentPage,
            lastPage,
            total,
            from,
            to,
            prevDisabled: prevPageBtn.disabled,
            nextDisabled: nextPageBtn.disabled,
        });
    }

    async function updateSummaryStatistics() {
        try {
            // Get summary statistics with current filters
            const stats = await fetchSummaryStatistics(currentFilters);

            // Update summary cards
            summaryCards.innerHTML = `
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-people"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Total Employees</div>
                        <div class="summary-card-value">${
                            stats.employeeCount
                        }</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Total Budget</div>
                        <div class="summary-card-value">${formatCurrency(
                            stats.totalBudget
                        )}</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-wallet2"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Remaining Balance</div>
                        <div class="summary-card-value">${formatCurrency(
                            stats.totalRemaining
                        )}</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Average Usage</div>
                        <div class="summary-card-value">${
                            stats.averageUsage
                        }%</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.log(
                "Statistics data not available (empty state):",
                error.message
            );

            // Don't show error for empty state, just show zero values
            summaryCards.innerHTML = `
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-people"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Total Employees</div>
                        <div class="summary-card-value">0</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Total Budget</div>
                        <div class="summary-card-value">Rp 0</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-wallet2"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Remaining Balance</div>
                        <div class="summary-card-value">Rp 0</div>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="summary-card-content">
                        <div class="summary-card-title">Average Usage</div>
                        <div class="summary-card-value">0%</div>
                    </div>
                </div>
            `;
        }
    }

    function showNotification(message, type = "success") {
        // Create and show a notification (you can integrate with SweetAlert2 or other notification library)
        const alertClass =
            type === "error"
                ? "alert-danger"
                : type === "info"
                ? "alert-info"
                : "alert-success";

        // You can replace this with a more sophisticated notification system
        console.log(`${type.toUpperCase()}: ${message}`);

        // Optional: Show a simple toast notification
        if (typeof Swal !== "undefined") {
            Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            }).fire({
                icon:
                    type === "error"
                        ? "error"
                        : type === "info"
                        ? "info"
                        : "success",
                title: message,
            });
        }
    }

    async function showInitializeBalancesModal() {
        try {
            // Setup modal event handlers only once
            if (!modalHandlersInitialized) {
                setupModalHandlers();
                modalHandlersInitialized = true;
            }

            // Show the modal
            const modal = new bootstrap.Modal(
                document.getElementById("initializeBalancesModal")
            );
            modal.show();
        } catch (error) {
            console.error("Error showing initialize modal:", error);
            showNotification(
                "Error loading modal data: " + error.message,
                "error"
            );
        }
    }

    function generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = "";

        for (let year = currentYear; year >= currentYear - 10; year--) {
            const selected = year === currentYear ? "selected" : "";
            options += `<option value="${year}" ${selected}>${year}</option>`;
        }

        return options;
    }

    async function exportData() {
        try {
            // Show loading state
            exportDataBtn.disabled = true;
            exportDataBtn.innerHTML =
                '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Exporting...';

            const result = await exportBenefitBalancesApi(currentFilters);

            // Show success message
            showNotification(
                `Successfully exported ${result.rowCount} records to ${result.filename}`,
                "success"
            );
        } catch (error) {
            console.error("Error exporting data:", error);
            showNotification("Error exporting data: " + error.message, "error");
        } finally {
            // Reset button state
            exportDataBtn.disabled = false;
            exportDataBtn.innerHTML =
                '<i class="bi bi-download me-2"></i>Export Data';
        }
    }

    /**
     * Load employees for modal dropdown with search functionality
     */
    async function loadEmployeesForModal() {
        try {
            console.log("Loading employees for modal...");

            // Reset loading states
            isEmployeesLoaded = false;
            isSelect2Initialized = false;

            // Show loading state
            const employeeSelect = document.getElementById("employeeSelect");
            if (employeeSelect) {
                employeeSelect.innerHTML =
                    "<option>Loading employees...</option>";
            }

            // Disable submit button during loading
            const confirmButton = document.getElementById(
                "confirmInitializeBalances"
            );
            if (confirmButton) {
                confirmButton.disabled = true;
                confirmButton.textContent = "Loading employees...";
            }

            // Fetch all employees
            allEmployeesData = await BenefitBalancesApi.fetchAllEmployees();
            console.log("Loaded employees data:", allEmployeesData);

            // Mark employees as loaded
            isEmployeesLoaded = true;

            // Initialize Select2 with search functionality
            await initializeEmployeeSelect();

            // Re-enable submit button
            if (confirmButton) {
                confirmButton.disabled = false;
                confirmButton.innerHTML =
                    '<span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span> Initialize Balances';
            }

            console.log("Employee loading completed successfully");
        } catch (error) {
            console.error("Error loading employees for modal:", error);

            const employeeSelect = document.getElementById("employeeSelect");
            if (employeeSelect) {
                employeeSelect.innerHTML =
                    "<option>Failed to load employees</option>";
            }

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load employees. Please try again.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                });
            }
        }
    }

    /**
     * Initialize Select2 for employee selection with custom search
     */
    async function initializeEmployeeSelect() {
        return new Promise((resolve, reject) => {
            try {
                const employeeSelect =
                    document.getElementById("employeeSelect");
                if (!employeeSelect) {
                    console.warn("Employee select element not found");
                    resolve();
                    return;
                }

                // Clear existing options
                employeeSelect.innerHTML = "";

                // Add default option
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent =
                    "Search employees by NIK, name, or department...";
                employeeSelect.appendChild(defaultOption);

                // Add all employee options
                if (Array.isArray(allEmployeesData)) {
                    allEmployeesData.forEach((employee) => {
                        const option = document.createElement("option");
                        option.value = employee.id;
                        option.textContent = employee.displayText;
                        option.setAttribute("data-nik", employee.nik);
                        option.setAttribute("data-name", employee.name);
                        option.setAttribute(
                            "data-department",
                            employee.department
                        );
                        employeeSelect.appendChild(option);
                    });
                }

                // Initialize Select2 with custom configuration
                if (typeof $ !== "undefined" && $.fn.select2) {
                    // Destroy existing Select2 instance if exists
                    if (
                        $("#employeeSelect").hasClass(
                            "select2-hidden-accessible"
                        )
                    ) {
                        $("#employeeSelect").select2("destroy");
                    }

                    $("#employeeSelect").select2({
                        placeholder:
                            "Search employees by NIK, name, or department...",
                        allowClear: true,
                        width: "100%",
                        multiple: true,
                        dropdownParent: $("#initializeBalancesModal"),
                        matcher: function (params, data) {
                            // If there are no search terms, return all data
                            if ($.trim(params.term) === "") {
                                return data;
                            }

                            // Do not display the item if there is no 'text' property
                            if (typeof data.text === "undefined") {
                                return null;
                            }

                            // Search in NIK, name, and department
                            const searchTerm = params.term.toLowerCase();
                            const employeeData = allEmployeesData.find(
                                (emp) => emp.id == data.id
                            );

                            if (employeeData) {
                                const searchableText = employeeData.searchText;
                                if (searchableText.includes(searchTerm)) {
                                    return data;
                                }
                            }

                            // Return null if the term should not be displayed
                            return null;
                        },
                        templateResult: function (data) {
                            if (!data.id) {
                                return data.text;
                            }

                            // Find employee data
                            const employeeData = allEmployeesData.find(
                                (emp) => emp.id == data.id
                            );
                            if (!employeeData) {
                                return data.text;
                            }

                            // Create custom display template
                            const $result = $(
                                '<div class="employee-select-result">' +
                                    '<div class="employee-name">' +
                                    employeeData.name +
                                    "</div>" +
                                    '<div class="employee-details text-muted small">' +
                                    "NIK: " +
                                    employeeData.nik +
                                    " | Dept: " +
                                    employeeData.department +
                                    "</div>" +
                                    "</div>"
                            );

                            return $result;
                        },
                        templateSelection: function (data) {
                            if (!data.id) {
                                return data.text;
                            }

                            // Find employee data for selected item
                            const employeeData = allEmployeesData.find(
                                (emp) => emp.id == data.id
                            );
                            if (!employeeData) {
                                return data.text;
                            }

                            return (
                                employeeData.name +
                                " (" +
                                employeeData.nik +
                                ")"
                            );
                        },
                    });

                    // Wait for Select2 to be fully initialized
                    setTimeout(() => {
                        isSelect2Initialized = true;
                        console.log("Select2 initialized successfully");
                        resolve();
                    }, 100);
                } else {
                    console.warn("Select2 not available, using basic select");
                    isSelect2Initialized = true;
                    resolve();
                }
            } catch (error) {
                console.error("Error initializing employee select:", error);
                reject(error);
            }
        });
    }

    /**
     * Setup modal event handlers
     */
    function setupModalHandlers() {
        if (modalHandlersInitialized) {
            console.log("Modal handlers already initialized, skipping...");
            return;
        }

        console.log("Setting up modal handlers...");

        // Modal show event handler
        const modal = document.getElementById("initializeBalancesModal");
        if (modal) {
            // Remove existing event listeners if any
            modal.removeEventListener("show.bs.modal", loadEmployeesForModal);

            modal.addEventListener("show.bs.modal", async function () {
                console.log(
                    "Modal opening, loading employees and setting up year dropdown..."
                );

                // Reset processing flags when modal opens
                isProcessing = false;
                console.log("Processing flags reset on modal open");

                // Setup year dropdown
                const budgetYearSelect = document.getElementById("budgetYear");
                if (budgetYearSelect) {
                    budgetYearSelect.innerHTML = generateYearOptions();
                }

                // Load employees
                await loadEmployeesForModal();
            });

            // Add modal hide event handler to reset state
            modal.addEventListener("hidden.bs.modal", function () {
                console.log("Modal closing, resetting all states...");

                // Reset processing flags
                isProcessing = false;

                // Reset form
                const form = document.getElementById("initializeBalancesForm");
                if (form) {
                    form.reset();
                    form.classList.remove("was-validated");
                }

                // Clear Select2 selection
                if (typeof $ !== "undefined" && $.fn.select2) {
                    $("#employeeSelect").val(null).trigger("change");
                }

                // Reset button state
                const confirmButton = document.getElementById(
                    "confirmInitializeBalances"
                );
                if (confirmButton) {
                    confirmButton.disabled = false;
                    const spinner =
                        confirmButton.querySelector(".spinner-border");
                    if (spinner) spinner.classList.add("d-none");
                }

                console.log("Modal state reset completed");
            });
        }

        // Employee selection radio button handlers
        const allEmployeesRadio = document.getElementById("allEmployees");
        const selectedEmployeesRadio =
            document.getElementById("selectedEmployees");
        const employeeSelectContainer = document.querySelector(
            ".employee-select-container"
        );
        const employeeSelect = document.getElementById("employeeSelect");

        function toggleEmployeeSelect() {
            if (selectedEmployeesRadio && selectedEmployeesRadio.checked) {
                if (employeeSelectContainer)
                    employeeSelectContainer.classList.remove("d-none");
                if (employeeSelect) employeeSelect.removeAttribute("disabled");
            } else {
                if (employeeSelectContainer)
                    employeeSelectContainer.classList.add("d-none");
                if (employeeSelect)
                    employeeSelect.setAttribute("disabled", "disabled");

                // Clear selection when switching to "All Employees"
                if (typeof $ !== "undefined" && $.fn.select2) {
                    $("#employeeSelect").val(null).trigger("change");
                } else if (employeeSelect) {
                    employeeSelect.selectedIndex = -1;
                }
            }
        }

        if (allEmployeesRadio) {
            allEmployeesRadio.addEventListener("change", toggleEmployeeSelect);
        }
        if (selectedEmployeesRadio) {
            selectedEmployeesRadio.addEventListener(
                "change",
                toggleEmployeeSelect
            );
        }

        // Select All button handler
        const selectAllButton = document.getElementById("selectAllEmployees");
        if (selectAllButton) {
            selectAllButton.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                if (typeof $ !== "undefined" && $.fn.select2) {
                    const allValues = allEmployeesData.map((emp) =>
                        emp.id.toString()
                    );
                    $("#employeeSelect").val(allValues).trigger("change");
                } else {
                    // Fallback for basic select
                    const employeeSelect =
                        document.getElementById("employeeSelect");
                    if (employeeSelect) {
                        Array.from(employeeSelect.options).forEach((option) => {
                            if (option.value) option.selected = true;
                        });
                    }
                }
            });
        }

        // Clear selection button handler
        const clearSelectionButton = document.getElementById(
            "clearEmployeeSelection"
        );
        if (clearSelectionButton) {
            clearSelectionButton.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                if (typeof $ !== "undefined" && $.fn.select2) {
                    $("#employeeSelect").val(null).trigger("change");
                } else {
                    // Fallback for basic select
                    const employeeSelect =
                        document.getElementById("employeeSelect");
                    if (employeeSelect) {
                        employeeSelect.selectedIndex = -1;
                    }
                }
            });
        }

        // Initialize balance button handler
        const confirmButton = document.getElementById(
            "confirmInitializeBalances"
        );
        if (confirmButton) {
            // Remove any existing event listeners to prevent duplicates
            const newButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newButton, confirmButton);

            newButton.addEventListener("click", async function (event) {
                event.preventDefault();
                event.stopPropagation();

                // Multiple layers of protection against duplicate calls
                if (isProcessing) {
                    console.log("UI Level: Already processing, ignoring click");
                    return;
                }

                // Immediately disable button to prevent rapid clicks
                this.disabled = true;

                try {
                    await handleInitializeBalances();
                } catch (error) {
                    console.error("Error in button click handler:", error);
                } finally {
                    // Only re-enable if not processing anymore
                    if (!isProcessing) {
                        this.disabled = false;
                    }
                }
            });
        }

        modalHandlersInitialized = true;
        console.log("Modal handlers setup completed");
    }

    /**
     * Handle initialize balances form submission
     */
    async function handleInitializeBalances() {
        const requestId = Math.random().toString(36).substring(7);
        console.log(`[${requestId}] Initialization request started`);

        try {
            // First level protection: Check processing flag
            if (isProcessing) {
                console.log(
                    `[${requestId}] Main Level: Already processing initialization, skipping...`
                );
                return;
            }

            // Set processing flag immediately
            isProcessing = true;
            console.log(`[${requestId}] Processing flag set to true`);

            // Get form elements
            const form = document.getElementById("initializeBalancesForm");
            const yearSelect = document.getElementById("budgetYear");
            const allEmployeesRadio = document.getElementById("allEmployees");
            const selectedEmployeesRadio =
                document.getElementById("selectedEmployees");
            const employeeSelect = document.getElementById("employeeSelect");
            const confirmCheckbox = document.getElementById(
                "confirmInitialization"
            );
            const confirmButton = document.getElementById(
                "confirmInitializeBalances"
            );
            const spinner = confirmButton
                ? confirmButton.querySelector(".spinner-border")
                : null;

            // Validate that required form elements exist
            if (!form || !yearSelect || !confirmButton) {
                console.error(
                    `[${requestId}] Required form elements not found`
                );
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "error",
                        title: "Form Error",
                        text: "Required form elements are missing. Please refresh the page.",
                    });
                }
                return;
            }

            // Check if employees are fully loaded before proceeding
            if (!isEmployeesLoaded) {
                console.log(
                    `[${requestId}] Employees not yet loaded, please wait...`
                );
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "warning",
                        title: "Please Wait",
                        text: "Employee data is still loading. Please wait a moment and try again.",
                    });
                }
                return;
            }

            // Check if Select2 is initialized when selected employees mode
            if (
                selectedEmployeesRadio &&
                selectedEmployeesRadio.checked &&
                !isSelect2Initialized
            ) {
                console.log(
                    `[${requestId}] Select2 not yet initialized, please wait...`
                );
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "warning",
                        title: "Please Wait",
                        text: "Employee selection is still initializing. Please wait a moment and try again.",
                    });
                }
                return;
            }

            // Validate form
            if (!form.checkValidity()) {
                console.log(`[${requestId}] Form validation failed`);
                form.classList.add("was-validated");
                return;
            }

            // Additional validation for selected employees
            if (selectedEmployeesRadio && selectedEmployeesRadio.checked) {
                let selectedEmployeeIds = [];

                try {
                    if (typeof $ !== "undefined" && $.fn.select2) {
                        const selectValue = $("#employeeSelect").val();
                        selectedEmployeeIds = Array.isArray(selectValue)
                            ? selectValue
                            : [];
                    } else {
                        if (employeeSelect && employeeSelect.selectedOptions) {
                            selectedEmployeeIds = Array.from(
                                employeeSelect.selectedOptions
                            ).map((option) => option.value);
                        }
                    }
                } catch (error) {
                    console.error(
                        `[${requestId}] Error getting selected employees:`,
                        error
                    );
                    selectedEmployeeIds = [];
                }

                if (selectedEmployeeIds.length === 0) {
                    console.log(
                        `[${requestId}] Employee validation failed - no employees selected`
                    );
                    if (employeeSelect) {
                        employeeSelect.classList.add("is-invalid");
                    }
                    if (typeof Swal !== "undefined") {
                        Swal.fire({
                            icon: "warning",
                            title: "Validation Error",
                            text: "Please select at least one employee.",
                        });
                    }
                    return;
                } else {
                    if (employeeSelect) {
                        employeeSelect.classList.remove("is-invalid");
                    }
                }
            }

            // Show loading state
            confirmButton.disabled = true;
            if (spinner) spinner.classList.remove("d-none");
            console.log(`[${requestId}] UI in loading state`);

            // Prepare request data
            const year = parseInt(yearSelect.value);

            // Validate year
            if (isNaN(year) || year < 2000 || year > 2100) {
                console.error(
                    `[${requestId}] Invalid year value: ${yearSelect.value}`
                );
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "error",
                        title: "Invalid Year",
                        text: "Please select a valid year.",
                    });
                }
                return;
            }

            let employeeIds = null;

            if (selectedEmployeesRadio && selectedEmployeesRadio.checked) {
                try {
                    if (typeof $ !== "undefined" && $.fn.select2) {
                        const selectValue = $("#employeeSelect").val();
                        if (Array.isArray(selectValue)) {
                            employeeIds = selectValue
                                .map((id) => parseInt(id))
                                .filter((id) => !isNaN(id));
                        } else {
                            employeeIds = [];
                        }
                    } else {
                        if (employeeSelect && employeeSelect.selectedOptions) {
                            employeeIds = Array.from(
                                employeeSelect.selectedOptions
                            )
                                .map((option) => parseInt(option.value))
                                .filter((id) => !isNaN(id));
                        } else {
                            employeeIds = [];
                        }
                    }
                } catch (error) {
                    console.error(
                        `[${requestId}] Error processing employee IDs:`,
                        error
                    );
                    employeeIds = [];
                }
            }

            console.log(`[${requestId}] Prepared employeeIds:`, employeeIds);

            console.log(`[${requestId}] Initializing balances with data:`, {
                year,
                employeeIds,
                employeeCount: employeeIds ? employeeIds.length : "all",
            });

            // Call API with double-check protection
            console.log(`[${requestId}] About to call API...`);
            const result = await BenefitBalancesApi.initializeBenefitBalances(
                year,
                employeeIds
            );

            console.log(`[${requestId}] API call completed. Result:`, result);

            // Show success message
            if (typeof Swal !== "undefined") {
                await Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text:
                        result.message ||
                        "Benefit balances have been initialized successfully.",
                    showConfirmButton: true,
                });
            }

            // Close modal and refresh data
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("initializeBalancesModal")
            );
            if (modal) {
                modal.hide();
            }

            // Reset form
            form.reset();
            form.classList.remove("was-validated");

            // Clear Select2 selection
            if (typeof $ !== "undefined" && $.fn.select2) {
                $("#employeeSelect").val(null).trigger("change");
            }

            // Hide employee select container
            const employeeSelectContainer = document.querySelector(
                ".employee-select-container"
            );
            if (employeeSelectContainer) {
                employeeSelectContainer.classList.add("d-none");
            }

            // Refresh the benefit balances table
            await loadData();
        } catch (error) {
            console.error(`[${requestId}] Error initializing balances:`, error);

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text:
                        error.message ||
                        "Failed to initialize benefit balances. Please try again.",
                });
            }
        } finally {
            // Always reset processing flag
            isProcessing = false;
            console.log(`[${requestId}] Processing flag reset to false`);

            // Reset button state
            const confirmButton = document.getElementById(
                "confirmInitializeBalances"
            );
            if (confirmButton) {
                const spinner = confirmButton.querySelector(".spinner-border");
                confirmButton.disabled = false;
                if (spinner) spinner.classList.add("d-none");
                console.log(`[${requestId}] Button state reset`);
            }

            console.log(
                `[${requestId}] Balance initialization process completed`
            );
        }
    }
});
