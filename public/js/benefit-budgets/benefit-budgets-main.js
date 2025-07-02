/**
 * Benefit Budgets - Main Application Logic
 *
 * This file contains the main JavaScript logic for the Benefit Budgets management page.
 * It handles UI interactions, data management, and integration with the API layer.
 */

// Application state
let currentPage = 1;
let itemsPerPage = 10;
let currentFilters = {};
let benefitTypesData = [];
let employeeLevelsData = [];
let marriageStatusesData = [];
let isEditMode = false;
let currentEditId = null;

// DOM elements
const elements = {
    tableBody: null,
    paginationInfo: null,
    paginationSection: null,
    prevPageBtn: null,
    nextPageBtn: null,
    itemsPerPageSelect: null,
    emptyState: null,
    loadingSkeletons: null,
    // Filters
    filterBenefitType: null,
    filterEmployeeLevel: null,
    filterMarriageStatus: null,
    filterYear: null,
    searchInput: null,
    clearFiltersBtn: null,
    filterLoadingIndicator: null,
    // Modal elements
    budgetModal: null,
    budgetForm: null,
    budgetModalTitle: null,
    budgetId: null,
    benefitTypeId: null,
    employeeLevelId: null,
    marriageStatusId: null,
    budgetYear: null,
    budgetAmount: null,
    saveBudgetBtn: null,
    // Delete modal elements
    deleteBudgetModal: null,
    deleteBudgetId: null,
    confirmDeleteBtn: null,
    deleteBenefitType: null,
    deleteEmployeeLevel: null,
    deleteMarriageStatus: null,
    deleteYear: null,
    deleteAmount: null,
};

/**
 * Initialize the application
 */
async function initApp() {
    console.log("Initializing Benefit Budgets application...");

    try {
        // Initialize DOM elements
        initDOMElements();

        // Setup event listeners
        setupEventListeners();

        // Load dropdown data
        await loadDropdownData();

        // Load initial data
        await loadBenefitBudgets();

        console.log("Benefit Budgets application initialized successfully");
    } catch (error) {
        console.error("Error initializing application:", error);
        showErrorMessage(
            "Failed to initialize application. Please refresh the page."
        );
    }
}

/**
 * Initialize DOM element references
 */
function initDOMElements() {
    // Table elements
    elements.tableBody = document.getElementById("benefitBudgetsTableBody");
    elements.paginationInfo = document.getElementById("paginationInfo");
    elements.paginationSection = document.getElementById("paginationSection");
    elements.prevPageBtn = document.getElementById("prevPageBtn");
    elements.nextPageBtn = document.getElementById("nextPageBtn");
    elements.itemsPerPageSelect = document.getElementById("itemsPerPage");
    elements.emptyState = document.getElementById("emptyBenefitBudgets");
    elements.loadingSkeletons = document.querySelectorAll(".loading-skeleton");

    // Filter elements
    elements.filterBenefitType = document.getElementById("filterBenefitType");
    elements.filterEmployeeLevel = document.getElementById(
        "filterEmployeeLevel"
    );
    elements.filterMarriageStatus = document.getElementById(
        "filterMarriageStatus"
    );
    elements.filterYear = document.getElementById("filterYear");
    elements.searchInput = document.getElementById("searchBudget");
    elements.clearFiltersBtn = document.getElementById("clearFiltersBtn");
    elements.filterLoadingIndicator = document.getElementById(
        "filterLoadingIndicator"
    );

    // Modal elements
    elements.budgetModal = document.getElementById("budgetModal");
    elements.budgetForm = document.getElementById("budgetForm");
    elements.budgetModalTitle = document.getElementById("budgetModalTitle");
    elements.budgetId = document.getElementById("budgetId");
    elements.benefitTypeId = document.getElementById("benefitTypeId");
    elements.employeeLevelId = document.getElementById("employeeLevelId");
    elements.marriageStatusId = document.getElementById("marriageStatusId");
    elements.budgetYear = document.getElementById("budgetYear");
    elements.budgetAmount = document.getElementById("budgetAmount");
    elements.saveBudgetBtn = document.getElementById("saveBudget");

    // Delete modal elements
    elements.deleteBudgetModal = document.getElementById("deleteBudgetModal");
    elements.deleteBudgetId = document.getElementById("deleteBudgetId");
    elements.confirmDeleteBtn = document.getElementById("confirmDeleteBudget");
    elements.deleteBenefitType = document.getElementById("deleteBenefitType");
    elements.deleteEmployeeLevel = document.getElementById(
        "deleteEmployeeLevel"
    );
    elements.deleteMarriageStatus = document.getElementById(
        "deleteMarriageStatus"
    );
    elements.deleteYear = document.getElementById("deleteYear");
    elements.deleteAmount = document.getElementById("deleteAmount");
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Pagination events
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener("click", () =>
            changePage(currentPage - 1)
        );
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener("click", () =>
            changePage(currentPage + 1)
        );
    }

    if (elements.itemsPerPageSelect) {
        elements.itemsPerPageSelect.addEventListener("change", (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            loadBenefitBudgets();
        });
    }

    // Auto-filtering events with debounce
    let filterTimeout;

    // Search with debounce
    if (elements.searchInput) {
        elements.searchInput.addEventListener("input", (e) => {
            clearTimeout(filterTimeout);
            showFilterLoading(true);
            filterTimeout = setTimeout(() => {
                applyFiltersAutomatically();
            }, 500);
        });
    }

    // Filter dropdowns with auto-apply
    if (elements.filterBenefitType) {
        elements.filterBenefitType.addEventListener("change", () => {
            clearTimeout(filterTimeout);
            showFilterLoading(true);
            filterTimeout = setTimeout(() => {
                applyFiltersAutomatically();
            }, 300);
        });
    }

    if (elements.filterEmployeeLevel) {
        elements.filterEmployeeLevel.addEventListener("change", () => {
            clearTimeout(filterTimeout);
            showFilterLoading(true);
            filterTimeout = setTimeout(() => {
                applyFiltersAutomatically();
            }, 300);
        });
    }

    if (elements.filterMarriageStatus) {
        elements.filterMarriageStatus.addEventListener("change", () => {
            clearTimeout(filterTimeout);
            showFilterLoading(true);
            filterTimeout = setTimeout(() => {
                applyFiltersAutomatically();
            }, 300);
        });
    }

    if (elements.filterYear) {
        elements.filterYear.addEventListener("change", () => {
            clearTimeout(filterTimeout);
            showFilterLoading(true);
            filterTimeout = setTimeout(() => {
                applyFiltersAutomatically();
            }, 300);
        });
    }

    // Clear all filters button
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener("click", clearAllFilters);
    }

    // Modal events
    if (elements.saveBudgetBtn) {
        elements.saveBudgetBtn.addEventListener("click", saveBenefitBudget);
    }

    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener(
            "click",
            deleteBenefitBudgetConfirmed
        );
    }

    // Add budget button
    const addBudgetBtn = document.getElementById("addBudgetBtn");
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener("click", () => showBudgetModal());
    }

    // Form validation
    if (elements.budgetForm) {
        elements.budgetForm.addEventListener("input", validateForm);
    }

    // Currency formatting for budget amount
    if (elements.budgetAmount) {
        elements.budgetAmount.addEventListener(
            "input",
            formatBudgetAmountInput
        );
        elements.budgetAmount.addEventListener("blur", formatBudgetAmountInput);
    }

    // Modal cleanup events
    if (elements.budgetModal) {
        elements.budgetModal.addEventListener("hidden.bs.modal", resetForm);
    }
}

/**
 * Load dropdown data for filters and forms
 */
async function loadDropdownData() {
    try {
        // Load all dropdown data in parallel
        const [benefitTypes, employeeLevels, marriageStatuses] =
            await Promise.all([
                fetchBenefitTypes(),
                fetchEmployeeLevels(),
                fetchMarriageStatuses(),
            ]);

        benefitTypesData = benefitTypes;
        employeeLevelsData = employeeLevels;
        marriageStatusesData = marriageStatuses;

        // Populate dropdowns
        populateDropdowns();
    } catch (error) {
        console.error("Error loading dropdown data:", error);
        showErrorMessage(
            "Failed to load form data. Some features may not work properly."
        );
    }
}

/**
 * Populate all dropdown elements
 */
function populateDropdowns() {
    // Populate benefit types
    populateSelect(
        elements.filterBenefitType,
        benefitTypesData,
        "id",
        "name",
        "All"
    );
    populateSelect(
        elements.benefitTypeId,
        benefitTypesData,
        "id",
        "name",
        "Select Benefit Type"
    );

    // Populate employee levels
    populateSelect(
        elements.filterEmployeeLevel,
        employeeLevelsData,
        "id",
        "name",
        "All"
    );
    populateSelect(
        elements.employeeLevelId,
        employeeLevelsData,
        "id",
        "name",
        "Select Employee Level"
    );

    // Populate marriage statuses
    populateSelect(
        elements.filterMarriageStatus,
        marriageStatusesData,
        "id",
        "description",
        "All"
    );
    populateSelect(
        elements.marriageStatusId,
        marriageStatusesData,
        "id",
        "description",
        "Select Marriage Status"
    );

    // Populate year filter with recent years
    populateYearFilter();
}

/**
 * Populate a select element with data
 */
function populateSelect(
    selectElement,
    data,
    valueField,
    textField,
    defaultOption = null
) {
    if (!selectElement) return;

    // Clear existing options (except default)
    const hasDefault = defaultOption !== null;
    selectElement.innerHTML = hasDefault
        ? `<option value="">${defaultOption}</option>`
        : "";

    // Add data options
    data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElement.appendChild(option);
    });
}

/**
 * Populate year filter with recent years
 */
function populateYearFilter() {
    if (!elements.filterYear) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;

    elements.filterYear.innerHTML = '<option value="">All</option>';

    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        elements.filterYear.appendChild(option);
    }

    // Set current year as default for budget year input
    if (elements.budgetYear) {
        elements.budgetYear.value = currentYear;
    }
}

/**
 * Load benefit budgets data
 */
async function loadBenefitBudgets() {
    try {
        showLoading(true);

        const response = await fetchBenefitBudgets(
            currentPage,
            itemsPerPage,
            currentFilters
        );

        if (response.isEmpty) {
            showEmptyState();
        } else {
            renderBenefitBudgets(response.data);
            updatePagination(response.pagination);
        }

        // Update clear button visibility
        updateClearButtonVisibility();
    } catch (error) {
        console.error("Error loading benefit budgets:", error);
        showErrorState();
    } finally {
        showLoading(false);
    }
}

/**
 * Render benefit budgets in the table
 */
function renderBenefitBudgets(budgets) {
    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = "";
    elements.emptyState.classList.add("d-none");

    budgets.forEach((budget) => {
        const row = createBudgetRow(budget);
        elements.tableBody.appendChild(row);
    });
}

/**
 * Create a table row for a benefit budget
 */
function createBudgetRow(budget) {
    const row = document.createElement("tr");

    const benefitTypeName = budget.benefit_type?.name || "N/A";
    const levelEmployeeName = budget.level_employee?.name || "N/A";
    const marriageStatusDesc = budget.marriage_status?.description || "N/A";
    const formattedBudget = formatCurrency(budget.budget);

    row.innerHTML = `
        <td>${escapeHtml(benefitTypeName)}</td>
        <td>${escapeHtml(levelEmployeeName)}</td>
        <td>${escapeHtml(marriageStatusDesc)}</td>
        <td>${budget.year}</td>
        <td>${formattedBudget}</td>
        <td class="text-end">
            <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editBenefitBudget(${
                budget.id
            })" title="Edit Budget">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="showDeleteBudgetModal(${
                budget.id
            })" title="Delete Budget">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    return row;
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    if (!elements.loadingSkeletons) return;

    elements.loadingSkeletons.forEach((skeleton) => {
        skeleton.style.display = show ? "" : "none";
    });

    if (!show && elements.tableBody) {
        const skeletons =
            elements.tableBody.querySelectorAll(".loading-skeleton");
        skeletons.forEach((skeleton) => skeleton.remove());
    }
}

/**
 * Show empty state
 */
function showEmptyState() {
    if (!elements.tableBody || !elements.emptyState) return;

    elements.tableBody.innerHTML = "";
    elements.emptyState.classList.remove("d-none");

    // Hide pagination for empty state
    if (elements.paginationSection) {
        elements.paginationSection.style.display = "none";
    }
}

/**
 * Show error state
 */
function showErrorState() {
    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5">
                <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                <h5 class="mt-3">Error Loading Data</h5>
                <p class="text-muted">Something went wrong while loading benefit budgets.</p>
                <button type="button" class="btn btn-primary" onclick="loadBenefitBudgets()">
                    <i class="bi bi-arrow-clockwise me-1"></i> Retry
                </button>
            </td>
        </tr>
    `;

    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }
}

/**
 * Update pagination UI
 */
function updatePagination(pagination) {
    if (!elements.paginationInfo || !elements.paginationSection) return;

    // Show pagination section
    elements.paginationSection.style.display = "";

    // Update pagination info
    const { current_page, last_page, from, to, total } = pagination;
    elements.paginationInfo.textContent = `Showing ${from || 0} to ${
        to || 0
    } of ${total} entries`;

    // Update pagination buttons
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = current_page <= 1;
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled = current_page >= last_page;
    }
}

/**
 * Change page
 */
async function changePage(page) {
    if (page < 1) return;

    currentPage = page;
    await loadBenefitBudgets();
}

/**
 * Apply filters automatically (debounced)
 */
async function applyFiltersAutomatically() {
    try {
        currentFilters = {
            benefit_type_id: elements.filterBenefitType?.value || "",
            level_employee_id: elements.filterEmployeeLevel?.value || "",
            marriage_status_id: elements.filterMarriageStatus?.value || "",
            year: elements.filterYear?.value || "",
            search: elements.searchInput?.value.trim() || "",
        };

        // Debug logging for search
        console.log("Auto-filtering with filters:", currentFilters);

        // Remove empty filters
        Object.keys(currentFilters).forEach((key) => {
            if (!currentFilters[key]) {
                delete currentFilters[key];
            }
        });

        console.log("Final filters after cleanup:", currentFilters);

        currentPage = 1;
        await loadBenefitBudgets();

        // Hide loading indicator after successful filtering
        showFilterLoading(false);

        // Update clear button visibility
        updateClearButtonVisibility();
    } catch (error) {
        console.error("Error applying filters:", error);
        showFilterLoading(false);
    }
}

/**
 * Clear all filters
 */
async function clearAllFilters() {
    // Reset filter inputs
    if (elements.filterBenefitType) elements.filterBenefitType.value = "";
    if (elements.filterEmployeeLevel) elements.filterEmployeeLevel.value = "";
    if (elements.filterMarriageStatus) elements.filterMarriageStatus.value = "";
    if (elements.filterYear) elements.filterYear.value = "";
    if (elements.searchInput) elements.searchInput.value = "";

    // Show loading briefly for visual feedback
    showFilterLoading(true);

    // Reset filters and reload
    currentFilters = {};
    currentPage = 1;

    setTimeout(async () => {
        await loadBenefitBudgets();
        showFilterLoading(false);
        updateClearButtonVisibility();
    }, 200); // Small delay for better UX
}

/**
 * Show/hide filter loading indicator
 */
function showFilterLoading(show) {
    if (!elements.filterLoadingIndicator) return;

    elements.filterLoadingIndicator.style.display = show ? "flex" : "none";
}

/**
 * Update clear button visibility based on active filters
 */
function updateClearButtonVisibility() {
    if (!elements.clearFiltersBtn) return;

    const hasActiveFilters = Object.keys(currentFilters).length > 0;

    if (hasActiveFilters) {
        elements.clearFiltersBtn.classList.remove("d-none");
        elements.clearFiltersBtn.innerHTML = `
            <i class="bi bi-x-circle me-1"></i> 
            Clear Filters (${Object.keys(currentFilters).length})
        `;
    } else {
        elements.clearFiltersBtn.classList.add("d-none");
    }
}

/**
 * Show budget modal for create/edit
 */
function showBudgetModal(budgetData = null) {
    isEditMode = !!budgetData;
    currentEditId = budgetData?.id || null;

    // Update modal title
    if (elements.budgetModalTitle) {
        elements.budgetModalTitle.textContent = isEditMode
            ? "Edit Budget Allocation"
            : "Add New Budget Allocation";
    }

    // Update save button text
    if (elements.saveBudgetBtn) {
        const buttonText =
            elements.saveBudgetBtn.querySelector("span:not(.spinner-border)") ||
            elements.saveBudgetBtn;
        buttonText.textContent = isEditMode ? "Update" : "Save";
    }

    // Populate form if editing
    if (isEditMode && budgetData) {
        populateFormForEdit(budgetData);
    } else {
        resetForm();
    }

    // Show modal
    if (elements.budgetModal) {
        const modal = new bootstrap.Modal(elements.budgetModal);
        modal.show();
    }
}

/**
 * Populate form for editing
 */
function populateFormForEdit(budgetData) {
    if (elements.budgetId) elements.budgetId.value = budgetData.id;
    if (elements.benefitTypeId)
        elements.benefitTypeId.value = budgetData.benefit_type?.id || "";
    if (elements.employeeLevelId)
        elements.employeeLevelId.value = budgetData.level_employee?.id || "";
    if (elements.marriageStatusId)
        elements.marriageStatusId.value = budgetData.marriage_status?.id || "";
    if (elements.budgetYear) elements.budgetYear.value = budgetData.year;
    if (elements.budgetAmount)
        elements.budgetAmount.value = formatCurrency(budgetData.budget);
}

/**
 * Edit benefit budget
 */
async function editBenefitBudget(id) {
    try {
        const budgetData = await fetchBenefitBudgetById(id);
        showBudgetModal(budgetData);
    } catch (error) {
        console.error("Error fetching budget data for edit:", error);
        showErrorMessage("Failed to load budget data for editing.");
    }
}

/**
 * Save benefit budget (create or update)
 */
async function saveBenefitBudget() {
    if (!validateForm()) {
        return;
    }

    try {
        setButtonLoading(elements.saveBudgetBtn, true);

        const formData = getFormData();

        if (isEditMode) {
            await updateBenefitBudget(currentEditId, formData);
            await showSuccessMessage("Budget allocation updated successfully!");
        } else {
            await createBenefitBudget(formData);
            await showSuccessMessage("Budget allocation created successfully!");
        }

        // Close modal and reload data
        closeModalWithCleanup();
        await loadBenefitBudgets();
    } catch (error) {
        console.error("Error saving benefit budget:", error);

        if (error.status === 422) {
            // Validation errors
            displayValidationErrors(error.errors);
        } else {
            showErrorMessage(
                "Failed to save budget allocation. Please try again."
            );
        }
    } finally {
        setButtonLoading(elements.saveBudgetBtn, false);
    }
}

/**
 * Get form data
 */
function getFormData() {
    const budgetValue = elements.budgetAmount.value;
    const parsedBudget = parseCurrency(budgetValue);

    // Debug logging
    console.log("Form Data Debug:");
    console.log("Raw budget input:", budgetValue);
    console.log("Parsed budget:", parsedBudget);

    return {
        benefit_type_id: parseInt(elements.benefitTypeId.value),
        level_employee_id: parseInt(elements.employeeLevelId.value),
        marriage_status_id: elements.marriageStatusId.value
            ? parseInt(elements.marriageStatusId.value)
            : null,
        year: parseInt(elements.budgetYear.value),
        budget: parsedBudget,
    };
}

/**
 * Validate form
 */
function validateForm() {
    let isValid = true;

    // Clear previous errors
    clearValidationErrors();

    // Validate required fields
    if (!elements.benefitTypeId.value) {
        showFieldError("benefitTypeId", "Benefit type is required");
        isValid = false;
    }

    if (!elements.employeeLevelId.value) {
        showFieldError("employeeLevelId", "Employee level is required");
        isValid = false;
    }

    if (!elements.budgetYear.value) {
        showFieldError("budgetYear", "Budget year is required");
        isValid = false;
    }

    if (!elements.budgetAmount.value) {
        showFieldError("budgetAmount", "Budget amount is required");
        isValid = false;
    } else {
        const amount = parseCurrency(elements.budgetAmount.value);
        if (amount <= 0) {
            showFieldError(
                "budgetAmount",
                "Budget amount must be greater than 0"
            );
            isValid = false;
        }
    }

    return isValid;
}

/**
 * Show field validation error
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + "Error");

    if (field) {
        field.classList.add("is-invalid");
    }

    if (errorElement) {
        errorElement.textContent = message;
    }
}

/**
 * Clear validation errors
 */
function clearValidationErrors() {
    const fields = [
        "benefitTypeId",
        "employeeLevelId",
        "marriageStatusId",
        "budgetYear",
        "budgetAmount",
    ];

    fields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + "Error");

        if (field) {
            field.classList.remove("is-invalid");
        }

        if (errorElement) {
            errorElement.textContent = "";
        }
    });
}

/**
 * Display validation errors from API
 */
function displayValidationErrors(errors) {
    Object.keys(errors).forEach((field) => {
        let fieldId = field;

        // Map API field names to form field IDs
        if (field === "benefit_type_id") fieldId = "benefitTypeId";
        else if (field === "level_employee_id") fieldId = "employeeLevelId";
        else if (field === "marriage_status_id") fieldId = "marriageStatusId";
        else if (field === "year") fieldId = "budgetYear";
        else if (field === "budget") fieldId = "budgetAmount";

        const message = Array.isArray(errors[field])
            ? errors[field][0]
            : errors[field];
        showFieldError(fieldId, message);
    });
}

/**
 * Format budget amount input
 */
function formatBudgetAmountInput(event) {
    const input = event.target;
    let value = input.value.replace(/[^\d]/g, ""); // Remove non-digits

    if (value) {
        // Format as currency
        const number = parseInt(value);
        input.value = formatCurrency(number);
    }
}

/**
 * Show delete budget modal
 */
async function showDeleteBudgetModal(id) {
    try {
        const budgetData = await fetchBenefitBudgetById(id);

        // Populate delete modal with budget info
        if (elements.deleteBudgetId) elements.deleteBudgetId.value = id;
        if (elements.deleteBenefitType)
            elements.deleteBenefitType.textContent =
                budgetData.benefit_type?.name || "N/A";
        if (elements.deleteEmployeeLevel)
            elements.deleteEmployeeLevel.textContent =
                budgetData.level_employee?.name || "N/A";
        if (elements.deleteMarriageStatus)
            elements.deleteMarriageStatus.textContent =
                budgetData.marriage_status?.description || "N/A";
        if (elements.deleteYear)
            elements.deleteYear.textContent = budgetData.year;
        if (elements.deleteAmount)
            elements.deleteAmount.textContent = formatCurrency(
                budgetData.budget
            );

        // Show modal
        if (elements.deleteBudgetModal) {
            const modal = new bootstrap.Modal(elements.deleteBudgetModal);
            modal.show();
        }
    } catch (error) {
        console.error("Error loading budget data for delete:", error);
        showErrorMessage("Failed to load budget data. Please try again.");
    }
}

/**
 * Delete benefit budget (confirmed)
 */
async function deleteBenefitBudgetConfirmed() {
    const budgetId = elements.deleteBudgetId.value;

    if (!budgetId) return;

    try {
        setButtonLoading(elements.confirmDeleteBtn, true);

        await deleteBenefitBudget(budgetId);

        // Close modal and show success message
        closeDeleteModalWithCleanup();
        await showSuccessMessage("Budget allocation deleted successfully!");

        // Reload data
        await loadBenefitBudgets();
    } catch (error) {
        console.error("Error deleting benefit budget:", error);
        showErrorMessage(
            "Failed to delete budget allocation. Please try again."
        );
    } finally {
        setButtonLoading(elements.confirmDeleteBtn, false);
    }
}

/**
 * Reset form
 */
function resetForm() {
    if (!elements.budgetForm) return;

    elements.budgetForm.reset();
    clearValidationErrors();

    // Reset hidden fields
    if (elements.budgetId) elements.budgetId.value = "";

    // Set default year
    const currentYear = new Date().getFullYear();
    if (elements.budgetYear) elements.budgetYear.value = currentYear;

    isEditMode = false;
    currentEditId = null;
}

/**
 * Close modal with cleanup
 */
function closeModalWithCleanup() {
    return new Promise((resolve) => {
        if (!elements.budgetModal) {
            resolve();
            return;
        }

        const modal = bootstrap.Modal.getInstance(elements.budgetModal);
        if (modal) {
            // Add one-time event listener for modal hidden
            const handleHidden = () => {
                elements.budgetModal.removeEventListener(
                    "hidden.bs.modal",
                    handleHidden
                );
                forceModalCleanup();
                setTimeout(resolve, 100); // Small delay for cleanup
            };

            elements.budgetModal.addEventListener(
                "hidden.bs.modal",
                handleHidden
            );
            modal.hide();
        } else {
            resolve();
        }
    });
}

/**
 * Close delete modal with cleanup
 */
function closeDeleteModalWithCleanup() {
    return new Promise((resolve) => {
        if (!elements.deleteBudgetModal) {
            resolve();
            return;
        }

        const modal = bootstrap.Modal.getInstance(elements.deleteBudgetModal);
        if (modal) {
            // Add one-time event listener for modal hidden
            const handleHidden = () => {
                elements.deleteBudgetModal.removeEventListener(
                    "hidden.bs.modal",
                    handleHidden
                );
                forceModalCleanup();
                setTimeout(resolve, 100); // Small delay for cleanup
            };

            elements.deleteBudgetModal.addEventListener(
                "hidden.bs.modal",
                handleHidden
            );
            modal.hide();
        } else {
            resolve();
        }
    });
}

/**
 * Force cleanup of modal artifacts
 */
function forceModalCleanup() {
    // Remove any leftover modal backdrops
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());

    // Restore body classes and styles
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";

    // Force repaint
    document.body.offsetHeight;
}

/**
 * Set button loading state
 */
function setButtonLoading(button, loading) {
    if (!button) return;

    const spinner = button.querySelector(".spinner-border");

    if (loading) {
        button.disabled = true;
        if (spinner) spinner.classList.remove("d-none");
    } else {
        button.disabled = false;
        if (spinner) spinner.classList.add("d-none");
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    return new Promise((resolve) => {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Success",
                text: message,
                icon: "success",
                timer: 3000,
                timerProgressBar: true,
                backdrop: false,
                customClass: {
                    popup: "swal2-no-backdrop",
                },
                didOpen: () => {
                    forceModalCleanup();
                },
            }).then(resolve);
        } else {
            alert(message);
            resolve();
        }
    });
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: "Error",
            text: message,
            icon: "error",
            confirmButtonText: "OK",
        });
    } else {
        alert(message);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text ? text.replace(/[&<>"']/g, (m) => map[m]) : "";
}

// Global functions for inline event handlers
window.editBenefitBudget = editBenefitBudget;
window.showDeleteBudgetModal = showDeleteBudgetModal;
window.loadBenefitBudgets = loadBenefitBudgets;

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
