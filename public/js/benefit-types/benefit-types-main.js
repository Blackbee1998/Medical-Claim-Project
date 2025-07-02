/**
 * Benefit Types - Main Application
 *
 * This file contains the main application logic for the Benefit Types management page.
 * It handles UI interactions, pagination, search, filtering, and CRUD operations.
 *
 * Dependencies:
 * - benefit-types-api.js (API integration)
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
        await loadBenefitTypes();

        console.log("Benefit Types page initialized successfully");
    } catch (error) {
        console.error("Error initializing benefit types page:", error);
        showNotification("Error initializing page", "error");
    }
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements = {
        // Table and data display
        tableBody: document.getElementById("benefitTypesTableBody"),
        emptyState: document.getElementById("emptyBenefitTypes"),
        paginationSection: document.getElementById("paginationSection"),
        paginationInfo: document.getElementById("paginationInfo"),

        // Search and filters
        searchInput: document.getElementById("searchBenefitType"),
        sortSelect: document.getElementById("sortBenefitType"),
        itemsPerPageSelect: document.getElementById("itemsPerPage"),

        // Pagination controls
        prevPageBtn: document.getElementById("prevPageBtn"),
        nextPageBtn: document.getElementById("nextPageBtn"),

        // Modal elements
        addBtn: document.getElementById("addBenefitTypeBtn"),
        modal: document.getElementById("benefitTypeModal"),
        modalTitle: document.getElementById("benefitTypeModalTitle"),
        form: document.getElementById("benefitTypeForm"),
        idInput: document.getElementById("benefitTypeId"),
        nameInput: document.getElementById("benefitTypeName"),
        nameError: document.getElementById("benefitTypeNameError"),
        saveBtn: document.getElementById("saveBenefitType"),

        // Delete modal
        deleteModal: document.getElementById("deleteBenefitTypeModal"),
        deleteName: document.getElementById("deleteBenefitTypeName"),
        deleteId: document.getElementById("deleteBenefitTypeId"),
        confirmDeleteBtn: document.getElementById("confirmDeleteBenefitType"),
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
                loadBenefitTypes();
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
            loadBenefitTypes();
        });
    }

    // Items per page
    if (elements.itemsPerPageSelect) {
        elements.itemsPerPageSelect.addEventListener("change", function () {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page
            loadBenefitTypes();
        });
    }

    // Pagination controls
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                loadBenefitTypes();
            }
        });
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener("click", function () {
            // Will be enabled/disabled based on pagination data
            currentPage++;
            loadBenefitTypes();
        });
    }

    // Add new benefit type button
    if (elements.addBtn) {
        elements.addBtn.addEventListener("click", function () {
            openAddModal();
        });
    }

    // Save button
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener("click", function () {
            saveBenefitType();
        });
    }

    // Form submission (Enter key)
    if (elements.form) {
        elements.form.addEventListener("submit", function (e) {
            e.preventDefault();
            saveBenefitType();
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
 * Load benefit types from API and update the UI
 */
async function loadBenefitTypes() {
    if (isLoading) return;

    try {
        isLoading = true;
        showLoadingState();

        const response = await BenefitTypesApi.fetchBenefitTypes(
            currentPage,
            itemsPerPage,
            currentFilters
        );

        if (response.isEmpty) {
            showEmptyState();
        } else {
            displayBenefitTypes(response.data);
            updatePagination(response.pagination);
        }
    } catch (error) {
        console.error("Error loading benefit types:", error);
        showErrorState();
    } finally {
        isLoading = false;
        hideLoadingState();
    }
}

/**
 * Display benefit types in the table
 */
function displayBenefitTypes(benefitTypes) {
    if (!elements.tableBody) return;

    // Hide empty state
    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }

    // Build table rows
    const tableRows = benefitTypes
        .map((benefitType) => {
            const createdDate = formatDate(benefitType.created_at);
            const updatedDate = formatDate(benefitType.updated_at);

            return `
            <tr>
                <td data-label="Benefit Type Name">
                    <span class="fw-medium">${escapeHtml(
                        benefitType.name
                    )}</span>
                </td>
                <td data-label="Date Created">
                    <span class="text-muted">${createdDate}</span>
                </td>
                <td data-label="Last Updated">
                    <span class="text-muted">${updatedDate}</span>
                </td>
                <td data-label="Actions" class="text-end">
                    <button type="button" class="btn btn-outline-primary btn-action" 
                            onclick="editBenefitType(${benefitType.id})" 
                            title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-action" 
                            onclick="deleteBenefitType(${
                                benefitType.id
                            }, '${escapeHtml(benefitType.name)}')" 
                            title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        })
        .join("");

    elements.tableBody.innerHTML = tableRows;

    // Show pagination section
    if (elements.paginationSection) {
        elements.paginationSection.classList.remove("d-none");
    }
}

/**
 * Update pagination controls and info
 */
function updatePagination(pagination) {
    if (!pagination) return;

    // Update pagination info
    if (elements.paginationInfo) {
        const from = pagination.from || 0;
        const to = pagination.to || 0;
        const total = pagination.total || 0;

        elements.paginationInfo.textContent = `Showing ${from} to ${to} of ${total} entries`;
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
 * Show loading state
 */
function showLoadingState() {
    if (!elements.tableBody) return;

    // Hide empty state
    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }

    // Show loading skeleton
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
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state is hidden when data is displayed or empty state is shown
}

/**
 * Show empty state
 */
function showEmptyState() {
    if (!elements.tableBody || !elements.emptyState) return;

    // Clear table body
    elements.tableBody.innerHTML = "";

    // Show empty state
    elements.emptyState.classList.remove("d-none");

    // Hide pagination
    if (elements.paginationSection) {
        elements.paginationSection.classList.add("d-none");
    }
}

/**
 * Show error state
 */
function showErrorState() {
    if (!elements.tableBody) return;

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5">
                <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
                <h5 class="mt-3">Error Loading Data</h5>
                <p class="text-muted">Please try refreshing the page</p>
                <button type="button" class="btn btn-primary" onclick="loadBenefitTypes()">
                    <i class="bi bi-arrow-clockwise me-1"></i> Retry
                </button>
            </td>
        </tr>
    `;

    // Hide empty state and pagination
    if (elements.emptyState) {
        elements.emptyState.classList.add("d-none");
    }
    if (elements.paginationSection) {
        elements.paginationSection.classList.add("d-none");
    }
}

/**
 * Open the add new benefit type modal
 */
function openAddModal() {
    if (!elements.modal) return;

    // Reset form
    resetForm();

    // Set modal title
    if (elements.modalTitle) {
        elements.modalTitle.textContent = "Add New Benefit Type";
    }

    // Show modal
    const modal = new bootstrap.Modal(elements.modal);
    modal.show();

    // Focus on name input
    setTimeout(() => {
        if (elements.nameInput) {
            elements.nameInput.focus();
        }
    }, 300);
}

/**
 * Open the edit benefit type modal
 */
async function editBenefitType(id) {
    if (!elements.modal) return;

    try {
        // Show loading in modal
        showModalLoading(true);

        // Fetch benefit type data
        const benefitType = await BenefitTypesApi.fetchBenefitTypeById(id);

        // Reset form
        resetForm();

        // Populate form with data
        if (elements.idInput) elements.idInput.value = benefitType.id;
        if (elements.nameInput) elements.nameInput.value = benefitType.name;

        // Set modal title
        if (elements.modalTitle) {
            elements.modalTitle.textContent = "Edit Benefit Type";
        }

        // Show modal
        const modal = new bootstrap.Modal(elements.modal);
        modal.show();

        // Focus on name input
        setTimeout(() => {
            if (elements.nameInput) {
                elements.nameInput.focus();
                elements.nameInput.select();
            }
        }, 300);
    } catch (error) {
        console.error("Error loading benefit type for edit:", error);
        showNotification("Error loading benefit type data", "error");
    } finally {
        showModalLoading(false);
    }
}

/**
 * Save benefit type (create or update)
 */
async function saveBenefitType() {
    if (!validateForm()) return;

    try {
        showModalLoading(true);

        const benefitTypeData = {
            name: elements.nameInput.value.trim(),
        };

        const isEdit = elements.idInput.value;

        let successMessage = "";

        if (isEdit) {
            // Update existing benefit type
            await BenefitTypesApi.updateBenefitType(
                parseInt(elements.idInput.value),
                benefitTypeData
            );
            successMessage = "Benefit type updated successfully";
        } else {
            // Create new benefit type
            await BenefitTypesApi.createBenefitType(benefitTypeData);
            successMessage = "Benefit type created successfully";
        }

        // Close modal with proper cleanup first
        await closeModalWithCleanup();

        // Show notification after modal is fully closed
        showNotification(successMessage, "success");

        // Reload data
        await loadBenefitTypes();
    } catch (error) {
        console.error("Error saving benefit type:", error);

        // Handle validation errors
        if (error.status === 422 && error.errors) {
            // Display validation errors on the form
            if (error.errors.name) {
                showValidationError(elements.nameInput, error.errors.name[0]);
            }
        } else {
            // Show generic error notification
            showNotification(
                error.message || "An error occurred while saving",
                "error"
            );
        }
    } finally {
        showModalLoading(false);
    }
}

/**
 * Open delete confirmation modal
 */
function deleteBenefitType(id, name) {
    if (!elements.deleteModal) return;

    // Set delete data
    if (elements.deleteId) elements.deleteId.value = id;
    if (elements.deleteName) elements.deleteName.textContent = name;

    // Show delete modal
    const modal = new bootstrap.Modal(elements.deleteModal);
    modal.show();
}

/**
 * Confirm and execute delete
 */
async function confirmDelete() {
    const id = elements.deleteId?.value;
    if (!id) return;

    try {
        showDeleteLoading(true);

        await BenefitTypesApi.deleteBenefitType(parseInt(id));

        // Close delete modal with proper cleanup first
        await closeDeleteModalWithCleanup();

        // Show notification after modal is fully closed
        showNotification("Benefit type deleted successfully", "success");

        // Reload data
        await loadBenefitTypes();
    } catch (error) {
        console.error("Error deleting benefit type:", error);
        // Error notification will be handled by API layer
    } finally {
        showDeleteLoading(false);
    }
}

/**
 * Validate the form
 */
function validateForm() {
    let isValid = true;

    // Validate name
    const name = elements.nameInput?.value?.trim();
    if (!name) {
        showValidationError(
            elements.nameInput,
            "Benefit type name is required"
        );
        isValid = false;
    } else if (name.length > 50) {
        showValidationError(
            elements.nameInput,
            "Name must not exceed 50 characters"
        );
        isValid = false;
    }

    return isValid;
}

/**
 * Show validation error for a field
 */
function showValidationError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");

    // Find or create error element
    let errorElement = input.parentNode.querySelector(".invalid-feedback");
    if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.className = "invalid-feedback";
        input.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
}

/**
 * Clear validation error for a field
 */
function clearValidationError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");

    const errorElement = input.parentNode.querySelector(".invalid-feedback");
    if (errorElement) {
        errorElement.textContent = "";
    }
}

/**
 * Reset the form
 */
function resetForm() {
    if (!elements.form) return;

    elements.form.reset();

    // Clear validation errors
    elements.form.querySelectorAll(".is-invalid").forEach((input) => {
        clearValidationError(input);
    });

    // Clear hidden ID field
    if (elements.idInput) elements.idInput.value = "";
}

/**
 * Close modal with proper cleanup to prevent layout issues
 */
async function closeModalWithCleanup() {
    return new Promise((resolve) => {
        const modal = bootstrap.Modal.getInstance(elements.modal);
        if (!modal) {
            resolve();
            return;
        }

        // Set up one-time event listener for when modal is completely hidden
        elements.modal.addEventListener(
            "hidden.bs.modal",
            function modalHiddenHandler() {
                // Remove this specific event listener to avoid accumulation
                elements.modal.removeEventListener(
                    "hidden.bs.modal",
                    modalHiddenHandler
                );

                // Force cleanup any remaining modal artifacts
                forceModalCleanup();

                // Small delay to ensure DOM is fully updated before showing notification
                setTimeout(() => {
                    resolve();
                }, 100);
            }
        );

        // Hide the modal
        modal.hide();
    });
}

/**
 * Force cleanup any remaining modal artifacts that might cause layout issues
 */
function forceModalCleanup() {
    // Remove any stray modal backdrop
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());

    // Ensure body classes are clean
    document.body.classList.remove("modal-open");

    // Reset body styles that might be set by modal
    if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
    }
    if (document.body.style.paddingRight) {
        document.body.style.paddingRight = "";
    }

    // Force repaint to ensure layout is updated
    document.body.offsetHeight;
}

/**
 * Close delete modal with proper cleanup
 */
async function closeDeleteModalWithCleanup() {
    return new Promise((resolve) => {
        const modal = bootstrap.Modal.getInstance(elements.deleteModal);
        if (!modal) {
            resolve();
            return;
        }

        // Set up one-time event listener for when modal is completely hidden
        elements.deleteModal.addEventListener(
            "hidden.bs.modal",
            function deleteModalHiddenHandler() {
                // Remove this specific event listener to avoid accumulation
                elements.deleteModal.removeEventListener(
                    "hidden.bs.modal",
                    deleteModalHiddenHandler
                );

                // Force cleanup any remaining modal artifacts
                forceModalCleanup();

                // Small delay to ensure DOM is fully updated before showing notification
                setTimeout(() => {
                    resolve();
                }, 100);
            }
        );

        // Hide the modal
        modal.hide();
    });
}

/**
 * Show/hide modal loading state
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
 * Show/hide delete modal loading state
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
 * Utility function to format date
 */
function formatDate(dateString) {
    if (!dateString) return "-";

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
        return dateString;
    }
}

/**
 * Utility function to escape HTML
 */
function escapeHtml(text) {
    if (typeof text !== "string") return text;

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.editBenefitType = editBenefitType;
window.deleteBenefitType = deleteBenefitType;
window.loadBenefitTypes = loadBenefitTypes;

// Export for module usage if needed
const BenefitTypesMain = {
    loadBenefitTypes,
    openAddModal,
    editBenefitType,
    deleteBenefitType,
    showNotification,
};

window.BenefitTypesMain = BenefitTypesMain;
