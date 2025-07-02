/**
 * Level Employees - Main Application
 *
 * This file contains the main application logic for the Level Employees management page.
 * It handles UI interactions, pagination, search, filtering, and CRUD operations.
 *
 * Dependencies:
 * - level-employees-api.js (API integration)
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
        await loadLevelEmployees();

        console.log("Level Employees page initialized successfully");
    } catch (error) {
        console.error("Error initializing level employees page:", error);
        showNotification("Error initializing page", "error");
    }
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements = {
        // Table and data display
        tableBody: document.getElementById("levelEmployeesTableBody"),
        emptyState: document.getElementById("emptyLevelEmployees"),
        paginationSection: document.getElementById("paginationSection"),
        paginationInfo: document.getElementById("paginationInfo"),

        // Search and filters
        searchInput: document.getElementById("searchLevel"),
        sortSelect: document.getElementById("sortLevel"),
        itemsPerPageSelect: document.getElementById("itemsPerPage"),

        // Pagination controls
        prevPageBtn: document.getElementById("prevPageBtn"),
        nextPageBtn: document.getElementById("nextPageBtn"),

        // Modal elements
        addBtn: document.getElementById("addLevelBtn"),
        modal: document.getElementById("levelModal"),
        modalTitle: document.getElementById("levelModalTitle"),
        form: document.getElementById("levelForm"),
        idInput: document.getElementById("levelId"),
        nameInput: document.getElementById("levelName"),
        nameError: document.getElementById("levelNameError"),
        saveBtn: document.getElementById("saveLevel"),

        // Delete modal
        deleteModal: document.getElementById("deleteLevelModal"),
        deleteName: document.getElementById("deleteLevelName"),
        deleteId: document.getElementById("deleteLevelId"),
        confirmDeleteBtn: document.getElementById("confirmDeleteLevel"),
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
                loadLevelEmployees();
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
            loadLevelEmployees();
        });
    }

    // Items per page
    if (elements.itemsPerPageSelect) {
        elements.itemsPerPageSelect.addEventListener("change", function () {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page
            loadLevelEmployees();
        });
    }

    // Pagination controls
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                loadLevelEmployees();
            }
        });
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener("click", function () {
            // Will be enabled/disabled based on pagination data
            currentPage++;
            loadLevelEmployees();
        });
    }

    // Add new level employee button
    if (elements.addBtn) {
        elements.addBtn.addEventListener("click", function () {
            openAddModal();
        });
    }

    // Save button
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener("click", function () {
            saveLevelEmployee();
        });
    }

    // Form submission (Enter key)
    if (elements.form) {
        elements.form.addEventListener("submit", function (e) {
            e.preventDefault();
            saveLevelEmployee();
        });
    }

    // Delete confirmation
    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener("click", function () {
            confirmDelete();
        });
    }

    // Clear validation on input change
    if (elements.nameInput) {
        elements.nameInput.addEventListener("input", function () {
            clearValidationError(this);
        });
    }
}

/**
 * Load level employees from API and update the UI
 */
async function loadLevelEmployees() {
    if (isLoading) return;

    try {
        isLoading = true;
        showLoadingState();

        const response = await LevelEmployeesApi.fetchLevelEmployees(
            currentPage,
            itemsPerPage,
            currentFilters
        );

        if (response.isEmpty) {
            showEmptyState();
        } else {
            displayLevelEmployees(response.data);
            updatePagination(response.pagination);
            hideLoadingState();
        }
    } catch (error) {
        console.error("Error loading level employees:", error);
        hideLoadingState();
        showErrorState();
        showNotification("Failed to load level employees", "error");
    } finally {
        isLoading = false;
    }
}

/**
 * Display level employees in the table
 * @param {Array} levelEmployees - Array of level employee objects
 */
function displayLevelEmployees(levelEmployees) {
    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = "";

    levelEmployees.forEach((levelEmployee) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="fw-medium">${escapeHtml(levelEmployee.name)}</div>
            </td>
            <td>
                <small class="text-muted">${formatDate(
                    levelEmployee.created_at
                )}</small>
            </td>
            <td>
                <small class="text-muted">${formatDate(
                    levelEmployee.updated_at
                )}</small>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" 
                            onclick="editLevelEmployee(${levelEmployee.id})"
                            title="Edit Level Employee">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" 
                            onclick="deleteLevelEmployee(${
                                levelEmployee.id
                            }, '${escapeHtml(levelEmployee.name)}')"
                            title="Delete Level Employee">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(row);
    });

    // Show table and hide empty state
    elements.emptyState?.classList.add("d-none");
    elements.paginationSection?.classList.remove("d-none");
}

/**
 * Update pagination controls and information
 * @param {Object} pagination - Pagination data from API
 */
function updatePagination(pagination) {
    if (!elements.paginationInfo) return;

    // Update pagination info text
    if (pagination.total > 0) {
        elements.paginationInfo.textContent = `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} entries`;
    } else {
        elements.paginationInfo.textContent = "No entries found";
    }

    // Update pagination buttons
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

    elements.tableBody.innerHTML = `
        <tr class="loading-skeleton">
            <td><div class="skeleton-line"></div></td>
            <td><div class="skeleton-line"></div></td>
            <td><div class="skeleton-line"></div></td>
            <td class="text-end"><div class="skeleton-line"></div></td>
        </tr>
        <tr class="loading-skeleton">
            <td><div class="skeleton-line"></div></td>
            <td><div class="skeleton-line"></div></td>
            <td><div class="skeleton-line"></div></td>
            <td class="text-end"><div class="skeleton-line"></div></td>
        </tr>
        <tr class="loading-skeleton">
            <td><div class="skeleton-line"></div></td>
            <td><div class="skeleton-line"></div></td>
            <td><div class="skeleton-line"></div></td>
            <td class="text-end"><div class="skeleton-line"></div></td>
        </tr>
    `;

    elements.emptyState?.classList.add("d-none");
    elements.paginationSection?.classList.remove("d-none");
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state is replaced by actual data or empty state
}

/**
 * Show empty state when no level employees found
 */
function showEmptyState() {
    if (!elements.tableBody || !elements.emptyState) return;

    elements.tableBody.innerHTML = "";
    elements.emptyState.classList.remove("d-none");
    elements.paginationSection?.classList.add("d-none");

    // Update pagination info
    if (elements.paginationInfo) {
        elements.paginationInfo.textContent = "No entries found";
    }
}

/**
 * Show error state when API request fails
 */
function showErrorState() {
    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5">
                <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                <h5 class="mt-3">Error Loading Data</h5>
                <p class="text-muted">There was an error loading level employees. Please try again.</p>
                <button class="btn btn-primary" onclick="loadLevelEmployees()">
                    <i class="bi bi-arrow-clockwise me-1"></i> Retry
                </button>
            </td>
        </tr>
    `;

    elements.emptyState?.classList.add("d-none");
    elements.paginationSection?.classList.add("d-none");
}

/**
 * Open the add modal for creating a new level employee
 */
function openAddModal() {
    resetForm();

    if (elements.modalTitle) {
        elements.modalTitle.textContent = "Add New Employee Level";
    }

    if (elements.modal) {
        const modal = new bootstrap.Modal(elements.modal);
        modal.show();
    }
}

/**
 * Edit an existing level employee
 * @param {number} id - Level employee ID
 */
async function editLevelEmployee(id) {
    try {
        showNotification("Loading level employee data...", "info");

        const levelEmployee = await LevelEmployeesApi.fetchLevelEmployeeById(
            id
        );

        // Populate form
        if (elements.idInput) elements.idInput.value = levelEmployee.id;
        if (elements.nameInput) elements.nameInput.value = levelEmployee.name;

        // Update modal title
        if (elements.modalTitle) {
            elements.modalTitle.textContent = "Edit Employee Level";
        }

        // Show modal
        if (elements.modal) {
            const modal = new bootstrap.Modal(elements.modal);
            modal.show();
        }
    } catch (error) {
        console.error("Error loading level employee for edit:", error);
        showNotification("Failed to load level employee data", "error");
    }
}

/**
 * Save level employee (create or update)
 */
async function saveLevelEmployee() {
    if (!validateForm()) return;

    try {
        showModalLoading(true);

        const formData = getFormData();
        const isEditing = formData.id && formData.id !== "";

        let result;
        if (isEditing) {
            result = await LevelEmployeesApi.updateLevelEmployee(formData.id, {
                name: formData.name,
            });
        } else {
            result = await LevelEmployeesApi.createLevelEmployee({
                name: formData.name,
            });
        }

        // Close modal with cleanup
        await closeModalWithCleanup();

        // Show success notification
        showNotification(
            `Level employee ${isEditing ? "updated" : "created"} successfully`,
            "success"
        );

        // Reload data
        await loadLevelEmployees();
    } catch (error) {
        console.error("Error saving level employee:", error);

        if (error.status === 422) {
            // Handle validation errors
            const errors = error.errors;
            if (errors.name) {
                showValidationError(elements.nameInput, errors.name[0]);
            }
        } else {
            showNotification("Failed to save level employee", "error");
        }
    } finally {
        showModalLoading(false);
    }
}

/**
 * Delete level employee
 * @param {number} id - Level employee ID
 * @param {string} name - Level employee name
 */
function deleteLevelEmployee(id, name) {
    if (elements.deleteId) elements.deleteId.value = id;
    if (elements.deleteName) elements.deleteName.textContent = name;

    if (elements.deleteModal) {
        const modal = new bootstrap.Modal(elements.deleteModal);
        modal.show();
    }
}

/**
 * Confirm and execute level employee deletion
 */
async function confirmDelete() {
    const id = elements.deleteId?.value;
    if (!id) return;

    try {
        showDeleteLoading(true);

        await LevelEmployeesApi.deleteLevelEmployee(id);

        // Close modal with cleanup
        await closeDeleteModalWithCleanup();

        // Show success notification
        showNotification("Level employee deleted successfully", "success");

        // Reload data
        await loadLevelEmployees();
    } catch (error) {
        console.error("Error deleting level employee:", error);
        showNotification("Failed to delete level employee", "error");
    } finally {
        showDeleteLoading(false);
    }
}

/**
 * Validate the form data
 * @returns {boolean} True if valid, false otherwise
 */
function validateForm() {
    let isValid = true;

    // Validate name
    const name = elements.nameInput?.value.trim();
    if (!name) {
        showValidationError(elements.nameInput, "Level name is required");
        isValid = false;
    } else if (name.length > 255) {
        showValidationError(
            elements.nameInput,
            "Level name cannot exceed 255 characters"
        );
        isValid = false;
    }

    return isValid;
}

/**
 * Show validation error for an input field
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showValidationError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");

    // Find or create error element
    const errorElement = input.parentElement.querySelector(".invalid-feedback");
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
}

/**
 * Clear validation error for an input field
 * @param {HTMLElement} input - Input element
 */
function clearValidationError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");

    const errorElement = input.parentElement.querySelector(".invalid-feedback");
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
        id: elements.idInput?.value.trim() || "",
        name: elements.nameInput?.value.trim() || "",
    };
}

/**
 * Reset the form to empty state
 */
function resetForm() {
    if (elements.form) {
        elements.form.reset();
    }

    if (elements.idInput) elements.idInput.value = "";
    if (elements.nameInput) elements.nameInput.value = "";

    // Clear any validation errors
    clearValidationError(elements.nameInput);
}

/**
 * Close modal with proper cleanup to prevent layout issues
 */
async function closeModalWithCleanup() {
    return new Promise((resolve) => {
        if (!elements.modal) {
            resolve();
            return;
        }

        const modal = bootstrap.Modal.getInstance(elements.modal);
        if (modal) {
            // Listen for modal hidden event
            function modalHiddenHandler() {
                elements.modal.removeEventListener(
                    "hidden.bs.modal",
                    modalHiddenHandler
                );

                // Force cleanup of any remaining modal artifacts
                forceModalCleanup();

                // Small delay to ensure cleanup is complete
                setTimeout(() => {
                    resolve();
                }, 100);
            }

            elements.modal.addEventListener(
                "hidden.bs.modal",
                modalHiddenHandler
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
    // Remove any remaining modal backdrops
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());

    // Reset body classes and styles
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";

    // Force repaint
    document.body.offsetHeight;
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
        if (modal) {
            // Listen for modal hidden event
            function deleteModalHiddenHandler() {
                elements.deleteModal.removeEventListener(
                    "hidden.bs.modal",
                    deleteModalHiddenHandler
                );

                // Force cleanup of any remaining modal artifacts
                forceModalCleanup();

                // Small delay to ensure cleanup is complete
                setTimeout(() => {
                    resolve();
                }, 100);
            }

            elements.deleteModal.addEventListener(
                "hidden.bs.modal",
                deleteModalHiddenHandler
            );
            modal.hide();
        } else {
            resolve();
        }
    });
}

/**
 * Show/hide loading state on modal save button
 * @param {boolean} loading - Whether to show loading state
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
 * Show/hide loading state on delete confirmation button
 * @param {boolean} loading - Whether to show loading state
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
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = "info") {
    // Use SweetAlert2 if available
    if (typeof Swal !== "undefined") {
        const icon =
            type === "success"
                ? "success"
                : type === "error"
                ? "error"
                : type === "warning"
                ? "warning"
                : "info";

        // Ensure no modal interference by setting high z-index and cleanup
        Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            backdrop: false, // Prevent backdrop interference
            customClass: {
                container: "swal2-no-backdrop",
            },
            didOpen: (toast) => {
                // Ensure toast appears above any remaining modal artifacts
                toast.style.zIndex = "999999";
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;

                // Final cleanup check
                forceModalCleanup();
            },
        }).fire({
            icon: icon,
            title: message,
        });
    } else {
        // Fallback to console log
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid Date";
    }
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (typeof text !== "string") return text;

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.editLevelEmployee = editLevelEmployee;
window.deleteLevelEmployee = deleteLevelEmployee;
window.loadLevelEmployees = loadLevelEmployees;

// Export for module usage if needed
const LevelEmployeesMain = {
    loadLevelEmployees,
    openAddModal,
    editLevelEmployee,
    deleteLevelEmployee,
    showNotification,
};

window.LevelEmployeesMain = LevelEmployeesMain;
