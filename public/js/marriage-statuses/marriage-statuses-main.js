/**
 * Marriage Statuses - Main Application
 *
 * This file contains the main application logic for the Marriage Statuses management page.
 * It handles UI interactions, pagination, search, filtering, and CRUD operations.
 *
 * Dependencies:
 * - marriage-statuses-api.js (API integration)
 * - SweetAlert2 (notifications)
 * - Bootstrap 5 (modals and UI components)
 */

// Global variables and state
let currentPage = 1;
let itemsPerPage = 10;
let currentFilters = {};
let isLoading = false;

// DOM elements (will be initialized on DOMContentLoaded)
let elements = {};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Initialize DOM element references
        initializeElements();

        // Set up event listeners
        setupEventListeners();

        // Load initial data
        await loadMarriageStatuses();

        console.log("Marriage Statuses page initialized successfully");
    } catch (error) {
        console.error("Error initializing marriage statuses page:", error);
        showNotification("Error initializing page", "error");
    }
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements = {
        // Table and data display
        tableBody: document.getElementById("marriageStatusesTableBody"),
        emptyState: document.getElementById("emptyMarriageStatuses"),
        paginationSection: document.getElementById("paginationSection"),
        paginationInfo: document.getElementById("paginationInfo"),

        // Search and filters
        searchInput: document.getElementById("searchStatus"),
        sortSelect: document.getElementById("sortStatus"),
        itemsPerPageSelect: document.getElementById("itemsPerPage"),

        // Pagination controls
        prevPageBtn: document.getElementById("prevPageBtn"),
        nextPageBtn: document.getElementById("nextPageBtn"),

        // Modal elements
        addBtn: document.getElementById("addStatusBtn"),
        modal: document.getElementById("statusModal"),
        modalTitle: document.getElementById("statusModalTitle"),
        form: document.getElementById("statusForm"),
        idInput: document.getElementById("statusId"),
        codeInput: document.getElementById("statusCode"),
        descriptionInput: document.getElementById("statusDescription"),
        codeError: document.getElementById("statusCodeError"),
        descriptionError: document.getElementById("statusDescriptionError"),
        saveBtn: document.getElementById("saveStatus"),

        // Delete modal
        deleteModal: document.getElementById("deleteStatusModal"),
        deleteCode: document.getElementById("deleteStatusCode"),
        deleteId: document.getElementById("deleteStatusId"),
        confirmDeleteBtn: document.getElementById("confirmDeleteStatus"),
    };

    // Validate that all required elements exist
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.warn("Missing DOM elements:", missingElements);
    }
}

/**
 * Set up event listeners for all interactive elements
 */
function setupEventListeners() {
    // Search functionality with debounce
    if (elements.searchInput) {
        let searchTimeout;
        elements.searchInput.addEventListener("input", function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = this.value.trim();
                currentPage = 1; // Reset to first page
                loadMarriageStatuses();
            }, 500); // 500ms debounce
        });
    }

    // Sort functionality
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener("change", function () {
            const [sortBy, sortDir] = this.value.split("_");
            currentFilters.sort_by = sortBy;
            currentFilters.sort_dir = sortDir;
            currentPage = 1; // Reset to first page
            loadMarriageStatuses();
        });
    }

    // Items per page
    if (elements.itemsPerPageSelect) {
        elements.itemsPerPageSelect.addEventListener("change", function () {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page
            loadMarriageStatuses();
        });
    }

    // Pagination controls
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                loadMarriageStatuses();
            }
        });
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener("click", function () {
            // Will be enabled/disabled based on pagination data
            currentPage++;
            loadMarriageStatuses();
        });
    }

    // Add new marriage status button
    if (elements.addBtn) {
        elements.addBtn.addEventListener("click", function () {
            openAddModal();
        });
    }

    // Save button
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener("click", function () {
            saveMarriageStatus();
        });
    }

    // Form submission (Enter key)
    if (elements.form) {
        elements.form.addEventListener("submit", function (e) {
            e.preventDefault();
            saveMarriageStatus();
        });
    }

    // Delete confirmation
    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener("click", function () {
            confirmDelete();
        });
    }

    // Clear validation on input change
    if (elements.codeInput) {
        elements.codeInput.addEventListener("input", function () {
            clearValidationError(this);
        });
    }

    if (elements.descriptionInput) {
        elements.descriptionInput.addEventListener("input", function () {
            clearValidationError(this);
        });
    }
}

/**
 * Load marriage statuses from API and update the UI
 */
async function loadMarriageStatuses() {
    if (isLoading) return;

    try {
        isLoading = true;
        showLoadingState();

        const response = await MarriageStatusesApi.fetchMarriageStatuses(
            currentPage,
            itemsPerPage,
            currentFilters
        );

        if (response.isEmpty) {
            showEmptyState();
        } else {
            displayMarriageStatuses(response.data);
            updatePagination(response.pagination);
            hideLoadingState();
        }
    } catch (error) {
        console.error("Error loading marriage statuses:", error);
        showErrorState();
        showNotification("Failed to load marriage statuses", "error");
    } finally {
        isLoading = false;
    }
}

/**
 * Display marriage statuses in the table
 * @param {Array} marriageStatuses - Array of marriage status objects
 */
function displayMarriageStatuses(marriageStatuses) {
    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = "";

    marriageStatuses.forEach((status) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <span class="fw-medium">${escapeHtml(status.code)}</span>
            </td>
            <td>
                ${escapeHtml(status.description || "-")}
            </td>
            <td>
                <small class="text-muted">${formatDate(
                    status.created_at
                )}</small>
            </td>
            <td>
                <small class="text-muted">${formatDate(
                    status.updated_at
                )}</small>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" 
                        onclick="editMarriageStatus(${status.id})" 
                        title="Edit marriage status">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" 
                        onclick="deleteMarriageStatus(${
                            status.id
                        }, '${escapeHtml(status.code)}')" 
                        title="Delete marriage status">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(row);
    });

    // Show table and hide empty state
    if (elements.tableBody.closest("table")) {
        elements.tableBody.closest("table").style.display = "";
    }
    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }
}

/**
 * Update pagination controls and info
 * @param {Object} pagination - Pagination data from API
 */
function updatePagination(pagination) {
    // Update pagination info
    if (elements.paginationInfo) {
        const from = pagination.from || 0;
        const to = pagination.to || 0;
        const total = pagination.total || 0;
        elements.paginationInfo.textContent = `Showing ${from} to ${to} of ${total} entries`;
    }

    // Update pagination controls
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = pagination.current_page <= 1;
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled =
            pagination.current_page >= pagination.last_page;
    }
}

/**
 * Show loading skeleton in the table
 */
function showLoadingState() {
    if (!elements.tableBody) return;

    // Show table and hide empty state
    if (elements.tableBody.closest("table")) {
        elements.tableBody.closest("table").style.display = "";
    }
    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }

    // Show skeleton rows
    const skeletonRows =
        elements.tableBody.querySelectorAll(".loading-skeleton");
    skeletonRows.forEach((row) => (row.style.display = ""));
}

/**
 * Hide loading skeleton
 */
function hideLoadingState() {
    if (!elements.tableBody) return;

    // Hide skeleton rows
    const skeletonRows =
        elements.tableBody.querySelectorAll(".loading-skeleton");
    skeletonRows.forEach((row) => (row.style.display = "none"));
}

/**
 * Show empty state when no data is available
 */
function showEmptyState() {
    hideLoadingState();

    // Hide table
    if (elements.tableBody && elements.tableBody.closest("table")) {
        elements.tableBody.closest("table").style.display = "none";
    }

    // Show empty state
    if (elements.emptyState) {
        elements.emptyState.classList.remove("d-none");
    }

    // Reset pagination
    if (elements.paginationInfo) {
        elements.paginationInfo.textContent = "No marriage statuses found";
    }
}

/**
 * Show error state when data loading fails
 */
function showErrorState() {
    hideLoadingState();

    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-5">
                <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                <h5 class="mt-3">Error Loading Data</h5>
                <p class="text-muted">Failed to load marriage statuses. Please try again.</p>
                <button type="button" class="btn btn-outline-primary" onclick="loadMarriageStatuses()">
                    <i class="bi bi-arrow-clockwise me-1"></i> Retry
                </button>
            </td>
        </tr>
    `;

    // Show table
    if (elements.tableBody.closest("table")) {
        elements.tableBody.closest("table").style.display = "";
    }

    // Hide empty state
    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }
}

/**
 * Open modal for adding new marriage status
 */
function openAddModal() {
    if (!elements.modal || !elements.modalTitle) return;

    // Set modal title
    elements.modalTitle.textContent = "Add New Marriage Status";

    // Reset form
    resetForm();

    // Show modal
    const modal = new bootstrap.Modal(elements.modal);
    modal.show();
}

/**
 * Open modal for editing existing marriage status
 * @param {number} id - Marriage status ID
 */
async function editMarriageStatus(id) {
    if (!elements.modal || !elements.modalTitle) return;

    try {
        // Set modal title
        elements.modalTitle.textContent = "Edit Marriage Status";

        // Show loading in modal
        showModalLoading(true);

        // Show modal first
        const modal = new bootstrap.Modal(elements.modal);
        modal.show();

        // Fetch marriage status data
        const marriageStatus =
            await MarriageStatusesApi.fetchMarriageStatusById(id);

        // Populate form
        if (elements.idInput) elements.idInput.value = marriageStatus.id;
        if (elements.codeInput) elements.codeInput.value = marriageStatus.code;
        if (elements.descriptionInput)
            elements.descriptionInput.value = marriageStatus.description || "";

        // Hide loading
        showModalLoading(false);
    } catch (error) {
        console.error("Error loading marriage status:", error);
        showNotification("Failed to load marriage status data", "error");
        // Close modal on error
        if (elements.modal) {
            const modal = bootstrap.Modal.getInstance(elements.modal);
            if (modal) modal.hide();
        }
    }
}

/**
 * Save marriage status (create or update)
 */
async function saveMarriageStatus() {
    if (!validateForm()) return;

    try {
        showModalLoading(true);

        const formData = getFormData();
        const isEdit = formData.id;

        let result;
        if (isEdit) {
            result = await MarriageStatusesApi.updateMarriageStatus(
                formData.id,
                {
                    code: formData.code,
                    description: formData.description,
                }
            );
        } else {
            result = await MarriageStatusesApi.createMarriageStatus({
                code: formData.code,
                description: formData.description,
            });
        }

        // Close modal with cleanup
        await closeModalWithCleanup();

        // Show success notification
        showNotification(
            `Marriage status ${isEdit ? "updated" : "created"} successfully`,
            "success"
        );

        // Reload data
        await loadMarriageStatuses();
    } catch (error) {
        showModalLoading(false);

        if (error.status === 422) {
            // Handle validation errors
            const errors = error.errors || {};
            Object.keys(errors).forEach((field) => {
                const input = elements[field + "Input"];
                if (input) {
                    showValidationError(input, errors[field][0]);
                }
            });
        } else {
            console.error("Error saving marriage status:", error);
            showNotification(
                `Failed to ${
                    elements.idInput && elements.idInput.value
                        ? "update"
                        : "create"
                } marriage status`,
                "error"
            );
        }
    }
}

/**
 * Show delete confirmation modal
 * @param {number} id - Marriage status ID
 * @param {string} code - Marriage status code
 */
function deleteMarriageStatus(id, code) {
    if (!elements.deleteModal || !elements.deleteCode || !elements.deleteId)
        return;

    // Set delete info
    elements.deleteCode.textContent = code;
    elements.deleteId.value = id;

    // Show delete modal
    const deleteModal = new bootstrap.Modal(elements.deleteModal);
    deleteModal.show();
}

/**
 * Confirm delete operation
 */
async function confirmDelete() {
    if (!elements.deleteId) return;

    const id = elements.deleteId.value;
    if (!id) return;

    try {
        showDeleteLoading(true);

        await MarriageStatusesApi.deleteMarriageStatus(id);

        // Close modal with cleanup
        await closeDeleteModalWithCleanup();

        // Show success notification
        showNotification("Marriage status deleted successfully", "success");

        // Reload data
        await loadMarriageStatuses();
    } catch (error) {
        showDeleteLoading(false);
        console.error("Error deleting marriage status:", error);
        showNotification("Failed to delete marriage status", "error");
    }
}

/**
 * Validate form data
 * @returns {boolean} True if valid
 */
function validateForm() {
    let isValid = true;

    // Validate code
    const code = elements.codeInput ? elements.codeInput.value.trim() : "";
    if (!code) {
        if (elements.codeInput)
            showValidationError(elements.codeInput, "Code is required");
        isValid = false;
    } else if (code.length > 10) {
        if (elements.codeInput)
            showValidationError(
                elements.codeInput,
                "Code must not exceed 10 characters"
            );
        isValid = false;
    }

    // Validate description
    const description = elements.descriptionInput
        ? elements.descriptionInput.value.trim()
        : "";
    if (!description) {
        if (elements.descriptionInput)
            showValidationError(
                elements.descriptionInput,
                "Description is required"
            );
        isValid = false;
    } else if (description.length > 255) {
        if (elements.descriptionInput)
            showValidationError(
                elements.descriptionInput,
                "Description must not exceed 255 characters"
            );
        isValid = false;
    }

    return isValid;
}

/**
 * Show validation error for input field
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showValidationError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");

    // Find corresponding error element
    const errorElement = document.getElementById(input.id + "Error");
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
}

/**
 * Clear validation error for input field
 * @param {HTMLElement} input - Input element
 */
function clearValidationError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");

    // Find corresponding error element
    const errorElement = document.getElementById(input.id + "Error");
    if (errorElement) {
        errorElement.textContent = "";
        errorElement.style.display = "none";
    }
}

/**
 * Get form data as object
 * @returns {Object} Form data
 */
function getFormData() {
    return {
        id: elements.idInput ? elements.idInput.value : null,
        code: elements.codeInput ? elements.codeInput.value.trim() : "",
        description: elements.descriptionInput
            ? elements.descriptionInput.value.trim()
            : "",
    };
}

/**
 * Reset form to initial state
 */
function resetForm() {
    if (elements.form) {
        elements.form.reset();
    }

    // Clear hidden ID
    if (elements.idInput) elements.idInput.value = "";

    // Clear validation errors
    if (elements.codeInput) clearValidationError(elements.codeInput);
    if (elements.descriptionInput)
        clearValidationError(elements.descriptionInput);

    // Reset loading state
    showModalLoading(false);
}

/**
 * Close modal with proper cleanup to prevent Bootstrap modal artifacts
 */
async function closeModalWithCleanup() {
    return new Promise((resolve) => {
        if (!elements.modal) {
            resolve();
            return;
        }

        const modal = bootstrap.Modal.getInstance(elements.modal);
        if (!modal) {
            resolve();
            return;
        }

        // Set up one-time event listener for modal hidden event
        function modalHiddenHandler() {
            elements.modal.removeEventListener(
                "hidden.bs.modal",
                modalHiddenHandler
            );

            // Cleanup Bootstrap artifacts
            setTimeout(() => {
                forceModalCleanup();
                resolve();
            }, 100);
        }

        elements.modal.addEventListener("hidden.bs.modal", modalHiddenHandler);
        modal.hide();
    });
}

/**
 * Force cleanup of modal artifacts (backdrop, scroll locks, etc.)
 */
function forceModalCleanup() {
    // Remove any lingering backdrops
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.remove();
    });

    // Remove modal-open class from body
    document.body.classList.remove("modal-open");

    // Reset body styles that might have been modified by Bootstrap
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
}

/**
 * Close delete modal with proper cleanup
 */
async function closeDeleteModalWithCleanup() {
    return new Promise((resolve) => {
        if (!elements.deleteModal) {
            resolve();
            return;
        }

        const modal = bootstrap.Modal.getInstance(elements.deleteModal);
        if (!modal) {
            resolve();
            return;
        }

        // Set up one-time event listener for modal hidden event
        function deleteModalHiddenHandler() {
            elements.deleteModal.removeEventListener(
                "hidden.bs.modal",
                deleteModalHiddenHandler
            );

            // Cleanup Bootstrap artifacts
            setTimeout(() => {
                forceModalCleanup();
                resolve();
            }, 100);
        }

        elements.deleteModal.addEventListener(
            "hidden.bs.modal",
            deleteModalHiddenHandler
        );
        modal.hide();
    });
}

/**
 * Show/hide loading state in modal
 * @param {boolean} loading - Whether to show loading
 */
function showModalLoading(loading) {
    if (!elements.saveBtn) return;

    const spinner = elements.saveBtn.querySelector(".spinner-border");

    if (loading) {
        elements.saveBtn.disabled = true;
        if (spinner) spinner.classList.remove("d-none");
    } else {
        elements.saveBtn.disabled = false;
        if (spinner) spinner.classList.add("d-none");
    }
}

/**
 * Show/hide loading state in delete modal
 * @param {boolean} loading - Whether to show loading
 */
function showDeleteLoading(loading) {
    if (!elements.confirmDeleteBtn) return;

    const spinner = elements.confirmDeleteBtn.querySelector(".spinner-border");

    if (loading) {
        elements.confirmDeleteBtn.disabled = true;
        if (spinner) spinner.classList.remove("d-none");
    } else {
        elements.confirmDeleteBtn.disabled = false;
        if (spinner) spinner.classList.add("d-none");
    }
}

/**
 * Show notification using SweetAlert2
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = "info") {
    if (typeof Swal === "undefined") {
        console.warn("SweetAlert2 not available, using console log:", message);
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }

    const config = {
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        title: message,
        icon: type,
        didOpen: (toast) => {
            // Ensure toast appears above any modal artifacts
            toast.style.zIndex = "999999";
            forceModalCleanup(); // Final cleanup check

            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
    };

    Swal.fire(config);
}

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return "-";

    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    } catch (error) {
        console.warn("Error formatting date:", dateString, error);
        return dateString;
    }
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (typeof text !== "string") {
        return text;
    }

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for global access (for onclick handlers)
window.editMarriageStatus = editMarriageStatus;
window.deleteMarriageStatus = deleteMarriageStatus;
window.loadMarriageStatuses = loadMarriageStatuses;

// Export main object for external access
window.MarriageStatusesMain = {
    loadMarriageStatuses,
    editMarriageStatus,
    deleteMarriageStatus,
    showNotification,
};
