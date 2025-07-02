/**
 * Employee Management JavaScript
 * Handles all UI interactions and API integrations for the employee page
 */

document.addEventListener("DOMContentLoaded", () => {
    // Import API functions
    setupNetworkMonitoring();
    initializeEmployeeManagement();
});

// Global state
const state = {
    employees: [],
    pagination: {
        currentPage: 1,
        totalPages: 1,
        perPage: 10,
        total: 0,
    },
    filters: {
        search: "",
        department: "",
        level_employee_id: "",
        marriage_status_id: "",
        gender: "",
    },
    sorting: {
        sort_by: "name",
        sort_dir: "asc",
    },
    loading: false,
    currentEmployeeId: null,
    levelEmployees: [],
    marriageStatuses: [],
    modalMode: "add", // 'add' or 'edit'
    cache: {
        levelEmployees: {
            data: [],
            timestamp: null,
            expiry: 30 * 60 * 1000, // 30 minutes in milliseconds
        },
        marriageStatuses: {
            data: [],
            timestamp: null,
            expiry: 30 * 60 * 1000, // 30 minutes in milliseconds
        },
    },
};

// Constants
const DEBOUNCE_DELAY = 300; // ms

/**
 * Initialize the employee management page
 */
async function initializeEmployeeManagement() {
    setupEventListeners();
    setupFormValidation();
    setupEnhancedDropdowns();
    await loadReferenceData();
    await loadEmployees();
    initializeTooltips();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Add employee button
    document
        .querySelector(".add-employee-btn")
        .addEventListener("click", () => openAddEmployeeModal());

    // Pagination controls - use more robust event handling
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");

    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", function (e) {
            e.preventDefault();
            console.log(
                "Prev button clicked, disabled:",
                this.disabled,
                "class contains disabled:",
                this.classList.contains("disabled")
            );
            if (!this.disabled && !this.classList.contains("disabled")) {
                changePage("prev");
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", function (e) {
            e.preventDefault();
            console.log(
                "Next button clicked, disabled:",
                this.disabled,
                "class contains disabled:",
                this.classList.contains("disabled")
            );
            if (!this.disabled && !this.classList.contains("disabled")) {
                changePage("next");
            }
        });
    }

    document
        .querySelector(".per-page-select")
        .addEventListener("change", handlePerPageChange);

    // Initialize filters module with callback
    EmployeeFilters.init((filters) => {
        state.filters = filters;
        state.pagination.currentPage = 1; // Reset to first page when filtering
        loadEmployees();
    });

    // Action buttons (will be delegated since rows are dynamic)
    document
        .querySelector(".employee-table tbody")
        .addEventListener("click", handleTableActions);

    // Form submission
    document
        .getElementById("saveEmployee")
        .addEventListener("click", handleEmployeeFormSubmit);

    // Delete confirmation
    document
        .getElementById("confirmDelete")
        .addEventListener("click", handleDeleteConfirmation);

    // Make pagination functions available globally for use in HTML
    window.employeeApp = {
        changePage: changePage,
        clearFilters: function () {
            if (
                typeof EmployeeFilters !== "undefined" &&
                EmployeeFilters.clearAllFilters
            ) {
                EmployeeFilters.clearAllFilters();
            }
        },
        openAddEmployeeModal: openAddEmployeeModal,
        // Add simple page navigation functions
        nextPage: function () {
            const nextBtn = document.getElementById("nextPage");
            if (!nextBtn.disabled && !nextBtn.classList.contains("disabled")) {
                changePage("next");
            }
        },
        prevPage: function () {
            const prevBtn = document.getElementById("prevPage");
            if (!prevBtn.disabled && !prevBtn.classList.contains("disabled")) {
                changePage("prev");
            }
        },
    };
}

/**
 * Set up enhanced dropdown behavior
 */
function setupEnhancedDropdowns() {
    const dropdowns = document.querySelectorAll(".form-select");

    dropdowns.forEach((dropdown) => {
        // Add focus animation
        dropdown.addEventListener("focus", function () {
            this.parentElement.classList.add("dropdown-focused");
        });

        dropdown.addEventListener("blur", function () {
            this.parentElement.classList.remove("dropdown-focused");
        });

        // Add change handler to update visual state
        dropdown.addEventListener("change", function () {
            updateDropdownState(this);
        });

        // Initialize state
        updateDropdownState(dropdown);
    });
}

/**
 * Update the visual state of a dropdown based on its selection
 * @param {HTMLElement} dropdown - The dropdown element
 */
function updateDropdownState(dropdown) {
    if (!dropdown) return;

    // Add a class if the dropdown has a selected value
    if (dropdown.value) {
        dropdown.classList.add("has-value");

        // Get selected option text for aria-label
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        if (selectedOption) {
            dropdown.setAttribute(
                "aria-label",
                `${
                    dropdown.getAttribute("aria-label") ||
                    dropdown.previousElementSibling?.textContent ||
                    ""
                } - Selected: ${selectedOption.textContent}`
            );
        }
    } else {
        dropdown.classList.remove("has-value");

        // Reset aria-label
        const label = dropdown.previousElementSibling?.textContent;
        if (label) {
            dropdown.setAttribute("aria-label", label);
        }
    }
}

/**
 * Check if cached data is still valid
 * @param {Object} cacheItem - The cache item to check
 * @returns {boolean} Whether the cache is valid
 */
function isCacheValid(cacheItem) {
    if (!cacheItem.timestamp) return false;

    const now = Date.now();
    const elapsed = now - cacheItem.timestamp;

    return elapsed < cacheItem.expiry;
}

/**
 * Load employee levels and marriage statuses for dropdowns
 * with caching
 */
async function loadReferenceData() {
    try {
        showPageLoader(true);

        // Load both reference data types in parallel for efficiency
        const promises = [
            loadEmployeeLevels().catch((error) => {
                console.error("Failed to load employee levels:", error);
                return null;
            }),
            loadMarriageStatuses().catch((error) => {
                console.error("Failed to load marriage statuses:", error);
                return null;
            }),
        ];

        // Wait for both to complete, but don't fail if one fails
        const [levelEmployees, marriageStatuses] = await Promise.all(promises);

        // Check if any failed
        let failureMessage = "";
        if (!levelEmployees) {
            failureMessage += "Employee levels ";
        }

        if (!marriageStatuses) {
            failureMessage += failureMessage
                ? "and marriage statuses "
                : "Marriage statuses ";
        }

        if (failureMessage) {
            showToast(
                "warning",
                `${failureMessage}could not be loaded. Some dropdowns may be incomplete.`
            );
        }

        // Check if both failed - this is critical
        if (!levelEmployees && !marriageStatuses) {
            showToast(
                "error",
                "Failed to load essential reference data. Please refresh the page."
            );
        }
    } catch (error) {
        showToast(
            "error",
            "Failed to load reference data. Please refresh the page."
        );
        console.error("Error loading reference data:", error);
    } finally {
        showPageLoader(false);
    }
}

/**
 * Load employee levels with caching
 */
async function loadEmployeeLevels() {
    try {
        // Check cache first
        if (
            isCacheValid(state.cache.levelEmployees) &&
            state.cache.levelEmployees.data.length > 0
        ) {
            console.log("Using cached employee levels");
            state.levelEmployees = state.cache.levelEmployees.data;
            populateLevelDropdowns(state.levelEmployees);
            return state.levelEmployees;
        }

        // Show loading in the dropdowns
        showLevelDropdownsLoading(true);

        // Fetch fresh data with retry capability
        const levelResponse = await retryWithBackoff(
            EmployeeApi.fetchEmployeeLevels,
            [],
            3, // max retries
            1000 // base delay (ms)
        );

        if (!levelResponse || !levelResponse.data) {
            throw new Error("Invalid response from level employees API");
        }

        // Update state and cache
        state.levelEmployees = levelResponse.data || [];
        state.cache.levelEmployees.data = state.levelEmployees;
        state.cache.levelEmployees.timestamp = Date.now();

        // Populate dropdowns
        populateLevelDropdowns(state.levelEmployees);

        return state.levelEmployees;
    } catch (error) {
        console.error("Error loading employee levels:", error);

        // Handle different error scenarios
        if (error.status === 401) {
            handleSessionExpiration();
        } else if (!navigator.onLine) {
            showToast(
                "warning",
                "Can't load employee levels while offline. Using cached data if available."
            );

            // Use whatever we have in cache, even if expired
            if (state.cache.levelEmployees.data.length > 0) {
                state.levelEmployees = state.cache.levelEmployees.data;
                populateLevelDropdowns(state.levelEmployees);
            } else {
                showToast("error", "No employee level data available offline.");
            }
        } else {
            showToast(
                "error",
                "Failed to load employee levels. Please try again."
            );
        }

        throw error;
    } finally {
        // Hide loading in the dropdowns
        showLevelDropdownsLoading(false);
    }
}

/**
 * Show or hide loading state in level dropdowns
 * @param {boolean} show - Whether to show or hide loading
 */
function showLevelDropdownsLoading(show) {
    const dropdowns = [
        document.getElementById("levelFilter"),
        document.getElementById("level"),
    ];

    dropdowns.forEach((dropdown) => {
        if (!dropdown) return;

        if (show) {
            dropdown.disabled = true;
            dropdown.classList.add("loading-select");

            // Add loading indicator
            const wrapper = dropdown.parentElement;
            if (!wrapper.querySelector(".select-loader")) {
                const loader = document.createElement("div");
                loader.className = "select-loader";
                loader.innerHTML = `
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
                wrapper.appendChild(loader);
            }
        } else {
            dropdown.disabled = false;
            dropdown.classList.remove("loading-select");

            // Remove loading indicator
            const wrapper = dropdown.parentElement;
            const loader = wrapper.querySelector(".select-loader");
            if (loader) {
                loader.remove();
            }
        }
    });
}

/**
 * Load marriage statuses with caching
 */
async function loadMarriageStatuses() {
    try {
        // Check cache first
        if (
            isCacheValid(state.cache.marriageStatuses) &&
            state.cache.marriageStatuses.data.length > 0
        ) {
            console.log("Using cached marriage statuses");
            state.marriageStatuses = state.cache.marriageStatuses.data;
            populateMarriageDropdowns(state.marriageStatuses);
            return state.marriageStatuses;
        }

        // Show loading in the dropdowns
        showMarriageDropdownsLoading(true);

        // Explicitly fetch from /v1/marriage-statuses endpoint
        const apiUrl = "/api/v1/marriage-statuses";
        const headers = EmployeeApi.Auth.getToken()
            ? {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  Authorization: `Bearer ${EmployeeApi.Auth.getToken()}`,
              }
            : {
                  "Content-Type": "application/json",
                  Accept: "application/json",
              };

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            const error = new Error(
                `Failed to fetch marriage statuses: ${response.status}`
            );
            error.status = response.status;
            throw error;
        }

        const responseData = await response.json();

        // Log raw response untuk debugging
        console.log("Marriage statuses raw API response:", responseData);

        // Transform data to match our expected format
        const marriageStatuses = responseData.data.map((status) => {
            // Pastikan ID selalu tersedia dan valid
            if (!status.id) {
                console.warn(
                    `Marriage status tanpa ID valid ditemukan:`,
                    status
                );
            }

            return {
                id: status.id ? parseInt(status.id, 10) : null, // Pastikan id integer
                code: status.code || "",
                description: status.description || "",
                value: status.id ? parseInt(status.id, 10) : null, // Pastikan value integer
                name:
                    status.description ||
                    status.code ||
                    `Status ${status.id || "Unknown"}`, // Untuk dropdown display
                created_at: status.created_at || "",
                updated_at: status.updated_at || "",
            };
        });

        // Filter out any items with null IDs
        const validMarriageStatuses = marriageStatuses.filter(
            (status) => status.id !== null
        );

        if (validMarriageStatuses.length === 0) {
            console.error(
                "No valid marriage statuses found with IDs in API response"
            );
            throw new Error("No valid marriage statuses available from API");
        }

        if (validMarriageStatuses.length < marriageStatuses.length) {
            console.warn(
                `Filtered out ${
                    marriageStatuses.length - validMarriageStatuses.length
                } invalid marriage statuses without IDs`
            );
        }

        // Log transformed data
        console.log("Transformed marriage statuses:", validMarriageStatuses);

        // Update state and cache
        state.marriageStatuses = validMarriageStatuses;
        state.cache.marriageStatuses.data = validMarriageStatuses;
        state.cache.marriageStatuses.timestamp = Date.now();

        // Populate dropdowns
        populateMarriageDropdowns(state.marriageStatuses);

        return state.marriageStatuses;
    } catch (error) {
        console.error("Error loading marriage statuses:", error);

        // Handle different error scenarios
        if (error.status === 401) {
            handleSessionExpiration();
        } else if (!navigator.onLine) {
            showToast(
                "warning",
                "Can't load marriage statuses while offline. Using cached data if available."
            );

            // Use whatever we have in cache, even if expired
            if (state.cache.marriageStatuses.data.length > 0) {
                state.marriageStatuses = state.cache.marriageStatuses.data;
                populateMarriageDropdowns(state.marriageStatuses);
            } else {
                showToast(
                    "error",
                    "No marriage status data available offline."
                );
            }
        } else {
            showToast(
                "error",
                "Failed to load marriage statuses. Please try again."
            );
        }

        throw error;
    } finally {
        // Hide loading in the dropdowns
        showMarriageDropdownsLoading(false);
    }
}

/**
 * Show or hide loading state in marriage dropdowns
 * @param {boolean} show - Whether to show or hide loading
 */
function showMarriageDropdownsLoading(show) {
    const dropdowns = [
        document.getElementById("marriageFilter"),
        document.getElementById("marriageStatus"),
    ];

    dropdowns.forEach((dropdown) => {
        if (!dropdown) return;

        if (show) {
            dropdown.disabled = true;
            dropdown.classList.add("loading-select");

            // Add loading indicator
            const wrapper = dropdown.parentElement;
            if (!wrapper.querySelector(".select-loader")) {
                const loader = document.createElement("div");
                loader.className = "select-loader";
                loader.innerHTML = `
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
                wrapper.appendChild(loader);
            }
        } else {
            dropdown.disabled = false;
            dropdown.classList.remove("loading-select");

            // Remove loading indicator
            const wrapper = dropdown.parentElement;
            const loader = wrapper.querySelector(".select-loader");
            if (loader) {
                loader.remove();
            }
        }
    });
}

/**
 * Populate level dropdowns with data from API
 * @param {Array} levels - Employee levels from API
 */
function populateLevelDropdowns(levels) {
    if (!Array.isArray(levels) || levels.length === 0) {
        console.warn("No employee levels available to populate dropdowns");
        return;
    }

    try {
        // Populate filter dropdown
        const levelFilter = document.getElementById("levelFilter");
        if (levelFilter) {
            // Save current selection
            const currentFilterValue = levelFilter.value;

            // Clear and add default option
            levelFilter.innerHTML =
                '<option value="" selected>All Levels</option>';

            // Add options from API
            levels.forEach((level) => {
                const option = document.createElement("option");
                option.value = level.id;
                option.textContent = level.name || `Level ${level.id}`;
                levelFilter.appendChild(option);
            });

            // Restore selection if it exists in new options
            if (currentFilterValue) {
                // Check if the value exists in the new options
                const exists = Array.from(levelFilter.options).some(
                    (option) => option.value === currentFilterValue
                );

                if (exists) {
                    levelFilter.value = currentFilterValue;
                }
            }
        }

        // Populate form dropdown
        const levelForm = document.getElementById("level");
        if (levelForm) {
            // Save current selection
            const currentFormValue = levelForm.value;

            // Clear and add default option
            levelForm.innerHTML = '<option value="">Select Level</option>';

            // Add options from API
            levels.forEach((level) => {
                const option = document.createElement("option");
                option.value = level.id;
                option.textContent = level.name || `Level ${level.id}`;
                if (level.description) {
                    option.setAttribute("title", level.description);
                }
                levelForm.appendChild(option);
            });

            // Restore selection if it exists in new options
            if (currentFormValue) {
                // Check if the value exists in the new options
                const exists = Array.from(levelForm.options).some(
                    (option) => option.value === currentFormValue
                );

                if (exists) {
                    levelForm.value = currentFormValue;
                }
            }
        }
    } catch (error) {
        console.error("Error populating level dropdowns:", error);
        showToast("error", "Failed to populate employee level dropdowns");
    }
}

/**
 * Populate marriage status dropdowns with data from API
 * @param {Array} statuses - Marriage statuses from API
 */
function populateMarriageDropdowns(statuses) {
    if (!Array.isArray(statuses) || statuses.length === 0) {
        console.warn("No marriage statuses available to populate dropdowns");
        return;
    }

    // Filter untuk memastikan hanya statuses dengan ID valid yang digunakan
    const validStatuses = statuses.filter(
        (status) => status.id !== null && status.id !== undefined
    );

    if (validStatuses.length === 0) {
        console.error(
            "No valid marriage statuses with IDs available for dropdowns"
        );
        return;
    }

    if (validStatuses.length < statuses.length) {
        console.warn(
            `Filtered out ${
                statuses.length - validStatuses.length
            } invalid marriage statuses for dropdowns`
        );
    }

    console.log("Populating marriage dropdowns with:", validStatuses);

    try {
        // Populate filter dropdown
        const marriageFilter = document.getElementById("marriageFilter");
        if (marriageFilter) {
            // Save current selection
            const currentFilterValue = marriageFilter.value;

            // Clear and add default option
            marriageFilter.innerHTML =
                '<option value="" selected>All Marriage Status</option>';

            // Add options from API
            validStatuses.forEach((status) => {
                const option = document.createElement("option");
                // Pastikan value adalah string dari integer yang valid
                option.value = String(status.id);
                // Use description as display text, fall back to code
                option.textContent =
                    status.description || status.code || `Status ${status.id}`;
                if (status.code) {
                    option.setAttribute("title", `Code: ${status.code}`);
                }
                marriageFilter.appendChild(option);
            });

            // Restore selection if it exists in new options
            if (currentFilterValue) {
                // Check if the value exists in the new options
                const exists = Array.from(marriageFilter.options).some(
                    (option) => option.value === currentFilterValue
                );

                if (exists) {
                    marriageFilter.value = currentFilterValue;
                }
            }
        }

        // Populate form dropdown
        const marriageForm = document.getElementById("marriageStatus");
        if (marriageForm) {
            // Save current selection
            const currentFormValue = marriageForm.value;

            // Clear and add default option
            marriageForm.innerHTML =
                '<option value="">Select Marriage Status</option>';

            // Add options from API
            validStatuses.forEach((status) => {
                const option = document.createElement("option");
                // Pastikan value adalah string dari integer yang valid
                option.value = String(status.id);
                // Use description as display text, fall back to code
                option.textContent =
                    status.description || status.code || `Status ${status.id}`;
                // Add code as title/tooltip if available
                if (status.code) {
                    option.setAttribute("title", `Code: ${status.code}`);
                }
                marriageForm.appendChild(option);
            });

            // Restore selection if it exists in new options
            if (currentFormValue) {
                // Check if the value exists in the new options
                const exists = Array.from(marriageForm.options).some(
                    (option) => option.value === String(currentFormValue)
                );

                if (exists) {
                    marriageForm.value = currentFormValue;
                }
            }

            // Jika dropdown kosong, tambahkan pesan warning
            if (marriageForm.options.length <= 1) {
                console.error(
                    "Marriage status dropdown is empty or has only default option"
                );

                // Tambahkan option placeholder yang menunjukkan error
                const errorOption = document.createElement("option");
                errorOption.value = "";
                errorOption.textContent =
                    "Error loading statuses - Please reload";
                errorOption.classList.add("text-danger");
                marriageForm.appendChild(errorOption);

                // Show toast warning
                showToast(
                    "warning",
                    "Failed to load marriage statuses. Please refresh the page."
                );
            }
        }
    } catch (error) {
        console.error("Error populating marriage dropdowns:", error);
        showToast("error", "Failed to populate marriage status dropdowns");
    }
}

/**
 * Enhanced function to handle network connectivity issues
 */
function setupNetworkMonitoring() {
    // Create network status indicator
    createNetworkStatusIndicator();

    // Listen for online/offline events
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    // Initial check
    if (!navigator.onLine) {
        handleOfflineStatus();
    } else {
        handleOnlineStatus();
    }
}

/**
 * Create the network status indicator element
 */
function createNetworkStatusIndicator() {
    // Check if already exists
    if (document.querySelector(".network-status")) return;

    const indicator = document.createElement("div");
    indicator.className = "network-status";
    indicator.innerHTML = `
        <span class="status-icon">
            <i class="bi bi-wifi"></i>
        </span>
        <span class="status-text">Online</span>
    `;

    document.body.appendChild(indicator);

    // Auto hide after 5 seconds
    setTimeout(() => {
        indicator.style.opacity = "0";
        setTimeout(() => {
            indicator.style.display = "none";
        }, 500);
    }, 5000);
}

/**
 * Update the network status indicator
 * @param {boolean} online - Whether the app is online
 */
function updateNetworkIndicator(online) {
    const indicator = document.querySelector(".network-status");
    if (!indicator) return;

    // Reset styles
    indicator.style.opacity = "1";
    indicator.style.display = "block";

    // Update classes and content
    if (online) {
        indicator.className = "network-status online";
        indicator.innerHTML = `
            <span class="status-icon">
                <i class="bi bi-wifi"></i>
            </span>
            <span class="status-text">Connected</span>
        `;
    } else {
        indicator.className = "network-status offline";
        indicator.innerHTML = `
            <span class="status-icon">
                <i class="bi bi-wifi-off"></i>
            </span>
            <span class="status-text">Disconnected</span>
        `;
    }

    // Auto hide after 5 seconds if online
    if (online) {
        setTimeout(() => {
            indicator.style.opacity = "0";
            setTimeout(() => {
                indicator.style.display = "none";
            }, 500);
        }, 5000);
    }
}

/**
 * Handle when the browser goes online
 */
function handleOnlineStatus() {
    console.log("Application is online");

    // Update network indicator
    updateNetworkIndicator(true);

    // Show a notification that we're back online
    showToast("success", "You are back online. Refreshing data...");

    // Reload data after a short delay
    setTimeout(() => {
        loadEmployees();
    }, 1000);

    // Remove any offline messages
    const offlineMessages = document.querySelectorAll(".offline-state");
    offlineMessages.forEach((el) => {
        const row = el.closest("tr");
        if (row) {
            row.remove();
        }
    });
}

/**
 * Handle when the browser goes offline
 */
function handleOfflineStatus() {
    console.log("Application is offline");

    // Update network indicator
    updateNetworkIndicator(false);

    // Show offline message in table
    showOfflineError();

    // Show toast notification
    showToast(
        "error",
        "You are currently offline. Some features may be unavailable."
    );
}

/**
 * Attempt to retry a failed API request with exponential backoff
 * @param {Function} apiCall - The API function to call
 * @param {Array} args - Arguments to pass to the API function
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} The API response
 */
async function retryWithBackoff(
    apiCall,
    args = [],
    maxRetries = 3,
    baseDelay = 1000
) {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            return await apiCall(...args);
        } catch (error) {
            retries++;

            // If we've exhausted all retries or this isn't a network error, throw
            if (
                retries >= maxRetries ||
                (error.message !== "Failed to fetch" &&
                    error.message !== "NetworkError" &&
                    error.message !== "Network request failed")
            ) {
                throw error;
            }

            // Calculate exponential backoff delay
            const delay = baseDelay * Math.pow(2, retries - 1);
            console.log(`Retry ${retries}/${maxRetries} after ${delay}ms`);

            // Wait for the calculated delay
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

/**
 * Load employees from API with current pagination and filters
 * with retry capability
 */
async function loadEmployees() {
    try {
        showTableLoader(true);

        const params = {
            page: state.pagination.currentPage,
            per_page: state.pagination.perPage,
            ...state.filters,
            ...state.sorting,
        };

        console.log("Loading employees with params:", params);

        // Use retry with backoff for fetch call
        const response = await retryWithBackoff(
            EmployeeApi.fetchEmployees,
            [params],
            3, // max retries
            1000 // base delay (ms)
        );

        // Check if the request was cancelled
        if (response && response.cancelled) {
            console.log("Request was cancelled, skipping update");
            return;
        }

        // Data is already transformed by the API service
        state.employees = response.data || [];

        // Debug the raw pagination data from API
        console.log("Raw pagination data from API:", response.pagination);

        // Update pagination state with API values
        state.pagination = response.pagination || {
            currentPage: 1,
            totalPages: 1,
            perPage: 10,
            total: 0,
        };

        console.log("Updated pagination state:", state.pagination);

        renderEmployeeTable();
        updatePaginationControls();

        // Check if this is first-time use and show banner if needed
        if (isFirstTimeUse()) {
            showFirstTimeBanner();
        }

        // Populate department filter from the loaded data
        if (Array.isArray(state.employees) && state.employees.length > 0) {
            EmployeeFilters.populateDepartmentFilter(state.employees);
        }
    } catch (error) {
        console.error("Error loading employees:", error);

        // Use the formatted error from DataTransformer
        const formattedError =
            EmployeeApi.DataTransformer.formatErrorForDisplay(error);

        // Generate user-friendly error message based on error type
        let errorMessage = formattedError.message;

        if (error.status === 401) {
            errorMessage = "Your session has expired. Please log in again.";
            // Handle session expiration
            handleSessionExpiration();
        } else if (error.status === 403) {
            errorMessage = "You don't have permission to view employees.";
        } else if (error.status === 500) {
            errorMessage = "Server error. Please try again later.";
        } else if (error.message === "Failed to fetch" || !navigator.onLine) {
            errorMessage =
                "Network connection issue. Check your internet connection.";
            showOfflineError();
        } else {
            // For other errors, check if it might be an empty database
            // and show first-time user experience
            if (
                state.pagination.currentPage === 1 &&
                Object.values(state.filters).every((val) => !val)
            ) {
                state.employees = [];
                renderEmployeeTable();
                updatePaginationControls();
                showFirstTimeBanner();
                return; // Skip showing error toast
            }
        }

        showToast("error", errorMessage);
    } finally {
        showTableLoader(false);
    }
}

/**
 * Handle session expiration
 */
function handleSessionExpiration() {
    // Listen for session expiration events
    window.addEventListener("auth:sessionExpired", () => {
        showToast("warning", "Your session has expired. Please log in again.");
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = "/login";
        }, 2000);
    });
}

/**
 * Render the employee table with current state data
 */
function renderEmployeeTable() {
    const tableBody = document.querySelector(".employee-table tbody");
    tableBody.innerHTML = "";

    if (state.employees.length === 0) {
        // Show empty state with different message based on filters
        const hasActiveFilters = Object.values(state.filters).some(
            (value) => value !== "" && value !== null
        );

        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center py-4">
                <div class="empty-state">
                    ${
                        hasActiveFilters
                            ? `<i class="bi bi-funnel-fill fs-1 mb-3 text-warning"></i>
                         <h5>No employees match your filters</h5>
                         <p>Try adjusting your search criteria or clear filters</p>
                         <button class="btn btn-outline-primary mt-2" onclick="clearFilters()">
                            <i class="bi bi-x-circle me-1"></i>Clear All Filters
                         </button>`
                            : `<i class="bi bi-people fs-1 mb-3 text-primary"></i>
                         <h5>No employees found</h5>
                         <p>Your employee database is empty. Start by adding your first employee.</p>
                         <button class="btn btn-primary mt-2" onclick="openAddEmployeeModal()">
                            <i class="bi bi-plus-circle me-1"></i>Add Employee
                         </button>`
                    }
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    state.employees.forEach((employee) => {
        const row = document.createElement("tr");

        // Use nested objects directly from API response
        const levelName = employee.level_employee?.name || "-";
        const marriageDesc = employee.marriage_status?.description || "-";

        // Format gender with first letter capitalized
        const formattedGender = employee.gender
            ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)
            : "-";

        row.innerHTML = `
            <td>${employee.nik || "-"}</td>
            <td>${employee.name || "-"}</td>
            <td>${employee.department || "-"}</td>
            <td>${levelName}</td>
            <td>${marriageDesc}</td>
            <td>${formattedGender}</td>
            <td>
                <div class="action-buttons">
                    <a href="#" class="action-icon view-icon" data-id="${
                        employee.id
                    }" data-bs-toggle="tooltip" title="View Details">
                        <i class="bi bi-eye"></i>
                    </a>
                    <a href="#" class="action-icon edit-icon" data-id="${
                        employee.id
                    }" data-bs-toggle="tooltip" title="Edit Employee">
                        <i class="bi bi-pencil-square"></i>
                    </a>
                    <a href="#" class="action-icon delete-icon" data-id="${
                        employee.id
                    }" data-name="${
            employee.name
        }" data-bs-toggle="tooltip" title="Delete Employee">
                        <i class="bi bi-trash"></i>
                    </a>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Reinitialize tooltips for dynamic content
    initializeTooltips();
}

/**
 * Update the pagination controls based on current state
 */
function updatePaginationControls() {
    const { currentPage, totalPages, perPage, total } = state.pagination;

    // Update pagination info text
    document.querySelector(
        ".pagination-info"
    ).textContent = `Showing page ${currentPage} of ${totalPages} (${total} employees)`;

    // Update pagination buttons state
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");

    // Set disabled attribute based on current page
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;

    // Update button classes to reflect state
    if (currentPage <= 1) {
        prevButton.classList.add("disabled");
    } else {
        prevButton.classList.remove("disabled");
    }

    if (currentPage >= totalPages) {
        nextButton.classList.add("disabled");
    } else {
        nextButton.classList.remove("disabled");
    }

    // Also update the data-page attributes
    prevButton.setAttribute("data-page", "prev");
    nextButton.setAttribute("data-page", "next");

    // Console log for debugging
    console.log("Pagination state updated:", {
        currentPage,
        totalPages,
        prevDisabled: prevButton.disabled,
        nextDisabled: nextButton.disabled,
    });

    // Update per page select
    const perPageSelect = document.querySelector(".per-page-select");
    perPageSelect.value = perPage.toString();
}

/**
 * Handle changing pages in pagination
 * @param {number|string} page - The page number or 'prev'/'next' string
 */
function changePage(page) {
    let targetPage = page;

    // Handle string values like 'prev' and 'next'
    if (page === "prev") {
        targetPage = state.pagination.currentPage - 1;
    } else if (page === "next") {
        targetPage = state.pagination.currentPage + 1;
    } else {
        // Convert to number if it's a string number
        targetPage = parseInt(page, 10);
    }

    console.log(
        `Changing to page ${targetPage}, currentPage: ${state.pagination.currentPage}, totalPages: ${state.pagination.totalPages}`
    );

    // Validate page number
    if (
        isNaN(targetPage) ||
        targetPage < 1 ||
        targetPage > state.pagination.totalPages
    ) {
        console.warn(
            `Invalid page number: ${targetPage}, total pages: ${state.pagination.totalPages}`
        );
        return;
    }

    // Update current page and reload data
    state.pagination.currentPage = targetPage;
    loadEmployees();
}

/**
 * Handle changing the number of items per page
 */
function handlePerPageChange(event) {
    state.pagination.perPage = parseInt(event.target.value);
    state.pagination.currentPage = 1; // Reset to first page when changing per page
    loadEmployees();
}

/**
 * Handle actions from the employee table (view, edit, delete)
 * @param {Event} event - The click event
 */
function handleTableActions(event) {
    const target = event.target.closest(".action-icon");
    if (!target) return;

    event.preventDefault();

    const employeeId = target.dataset.id;

    if (target.classList.contains("view-icon")) {
        openViewEmployeeModal(employeeId);
    } else if (target.classList.contains("edit-icon")) {
        openEditEmployeeModal(employeeId);
    } else if (target.classList.contains("delete-icon")) {
        openDeleteConfirmationModal(employeeId, target.dataset.name);
    }
}

/**
 * Open the modal for adding a new employee
 */
async function openAddEmployeeModal() {
    try {
        state.modalMode = "add";
        state.currentEmployeeId = null;

        // Show loading state
        const saveButton = document.getElementById("saveEmployee");
        if (saveButton) {
            toggleButtonLoading(saveButton, true);
        }

        // Reset form
        const form = document.getElementById("employeeForm");
        form.reset();
        clearValidationErrors();

        // Load marriage statuses directly from API to ensure we have the latest data
        let marriageStatusesLoaded = false;
        if (state.marriageStatuses.length === 0) {
            try {
                await loadMarriageStatuses();
                marriageStatusesLoaded = true;
                console.log(
                    "Marriage statuses loaded from API:",
                    state.marriageStatuses
                );
            } catch (err) {
                console.error("Failed to load marriage statuses:", err);
                showToast(
                    "warning",
                    "Could not load marriage statuses. Some features may not work correctly."
                );
            }
        } else {
            marriageStatusesLoaded = true;
            console.log(
                "Using existing marriage statuses:",
                state.marriageStatuses
            );
        }

        // Load level employees if needed
        if (state.levelEmployees.length === 0) {
            await loadEmployeeLevels();
        }

        // Pastikan atribut required ada pada field marriage status
        const marriageStatusSelect = document.getElementById("marriageStatus");
        if (marriageStatusSelect) {
            marriageStatusSelect.setAttribute("required", "required");

            // Pilih marriage status default jika tersedia
            if (marriageStatusesLoaded && state.marriageStatuses.length > 0) {
                // Cari marriage status valid pertama (dengan ID yang valid)
                const firstMarriageStatus = state.marriageStatuses.find(
                    (status) => status.id && !isNaN(parseInt(status.id, 10))
                );

                if (firstMarriageStatus && firstMarriageStatus.id) {
                    // Pastikan ID adalah integer
                    const marriageStatusId = parseInt(
                        firstMarriageStatus.id,
                        10
                    );
                    marriageStatusSelect.value = marriageStatusId;

                    console.log(
                        `Pre-selected marriage status from API: ID ${marriageStatusId} (${
                            firstMarriageStatus.description ||
                            firstMarriageStatus.code ||
                            "Unknown"
                        })`
                    );

                    // Tambahkan informasi ke subtitle form
                    const formSubtitle =
                        document.querySelector(".form-subtitle");
                    if (!formSubtitle) {
                        const newSubtitle = document.createElement("div");
                        newSubtitle.className =
                            "form-subtitle text-muted small mb-3";
                        newSubtitle.innerHTML = `<i class="bi bi-info-circle me-1"></i>Marriage Status: <strong>${
                            firstMarriageStatus.description ||
                            firstMarriageStatus.code ||
                            `Status ID: ${marriageStatusId}`
                        }</strong> pre-selected`;
                        const formTitle =
                            document.querySelector(".modal-body h5");
                        if (formTitle) {
                            formTitle.after(newSubtitle);
                        }
                    }

                    // Validasi bahwa nilai benar-benar telah diset
                    if (!marriageStatusSelect.value) {
                        console.error(
                            "Failed to set marriage status select value despite having valid data:",
                            {
                                marriageStatusId,
                                firstMarriageStatus,
                                selectCurrentValue: marriageStatusSelect.value,
                            }
                        );

                        // Coba lagi dengan force set
                        setTimeout(() => {
                            marriageStatusSelect.value = marriageStatusId;
                            console.log(
                                "After forced retry, marriage status value:",
                                marriageStatusSelect.value
                            );
                        }, 100);
                    }
                } else {
                    console.error(
                        "No valid marriage status with ID found in data:",
                        state.marriageStatuses
                    );
                    showToast(
                        "warning",
                        "Marriage status data appears invalid. Please select a value manually before saving."
                    );
                }
            } else {
                // Tidak bisa pre-select karena tidak ada data
                console.warn(
                    "No marriage status data available for pre-selection"
                );
                showToast(
                    "warning",
                    "No marriage status data available. Please select a marriage status before saving."
                );
            }
        }

        // Update modal title
        document.getElementById("employeeModalTitle").textContent =
            "Add New Employee";

        // Remove subtitle if exists
        const subtitleEl = document.querySelector(
            "#employeeModal .modal-subtitle"
        );
        if (subtitleEl) {
            subtitleEl.style.display = "none";
        }

        // Show modal
        const modal = new bootstrap.Modal(
            document.getElementById("employeeModal")
        );
        modal.show();
    } catch (error) {
        console.error("Error opening add employee modal:", error);
        showToast(
            "error",
            "Could not open add employee form. Please try again."
        );
    } finally {
        // Hide loading state
        const saveButton = document.getElementById("saveEmployee");
        if (saveButton) {
            toggleButtonLoading(saveButton, false);
        }
    }
}

/**
 * Open the modal for editing an employee
 * @param {string|number} employeeId - The ID of the employee to edit
 */
async function openEditEmployeeModal(employeeId) {
    try {
        state.modalMode = "edit";
        state.currentEmployeeId = employeeId;

        // Show loading state
        const saveButton = document.getElementById("saveEmployee");
        toggleButtonLoading(saveButton, true);

        // Fetch employee data first
        const response = await EmployeeApi.fetchEmployeeById(employeeId);
        const employee = response.data;

        if (!employee) {
            throw new Error("Employee data could not be loaded");
        }

        // Make sure reference data is loaded - do this first to ensure dropdowns are populated
        // We specifically need marriage statuses
        if (state.marriageStatuses.length === 0) {
            await loadMarriageStatuses();
        }

        // Load level employees if needed
        if (state.levelEmployees.length === 0) {
            await loadEmployeeLevels();
        }

        // Populate form
        document.getElementById("employeeId").value = employee.id;
        document.getElementById("nik").value = employee.nik || "";
        document.getElementById("name").value = employee.name || "";
        document.getElementById("department").value = employee.department || "";
        document.getElementById("gender").value = employee.gender || "";

        // Set level employee value
        document.getElementById("level").value =
            employee.level_employee?.id || "";

        // Handle marriage status - this is the critical part
        const marriageStatusSelect = document.getElementById("marriageStatus");

        // Pastikan atribut required ada
        marriageStatusSelect.setAttribute("required", "required");

        const marriageStatusId = employee.marriage_status?.id;

        if (marriageStatusId) {
            // Check if the marriage status exists in the dropdown
            const exists = Array.from(marriageStatusSelect.options).some(
                (option) => option.value == marriageStatusId
            );

            // If it doesn't exist, force reload the marriage statuses directly from API
            if (!exists) {
                console.log(
                    `Marriage status ID ${marriageStatusId} not found in dropdown, reloading data`
                );

                // Force refresh marriage statuses to ensure we have the latest data
                state.cache.marriageStatuses.timestamp = null;
                await loadMarriageStatuses();

                // Double-check if it's now available after reload
                const availableAfterReload = Array.from(
                    marriageStatusSelect.options
                ).some((option) => option.value == marriageStatusId);

                if (!availableAfterReload) {
                    console.warn(
                        `Marriage status ID ${marriageStatusId} still not found after reload`
                    );
                    // Try to get status details directly from API as a fallback
                    try {
                        const statusResponse = await fetch(
                            `/api/v1/marriage-statuses/${marriageStatusId}`,
                            {
                                headers: {
                                    Accept: "application/json",
                                    Authorization: EmployeeApi.Auth.getToken()
                                        ? `Bearer ${EmployeeApi.Auth.getToken()}`
                                        : "",
                                },
                            }
                        );

                        if (statusResponse.ok) {
                            const statusData = await statusResponse.json();
                            if (statusData.data) {
                                // Manually add this option to the dropdown
                                const newOption =
                                    document.createElement("option");
                                newOption.value = marriageStatusId;
                                newOption.textContent =
                                    statusData.data.description ||
                                    statusData.data.code ||
                                    `Status ${marriageStatusId}`;
                                marriageStatusSelect.appendChild(newOption);
                                console.log(
                                    `Manually added marriage status ${marriageStatusId} to dropdown`
                                );
                            }
                        }
                    } catch (e) {
                        console.error(
                            `Failed to fetch individual marriage status: ${e.message}`
                        );
                    }
                }
            }

            // Set the value - this should now work
            marriageStatusSelect.value = marriageStatusId;

            // If still not set correctly, show a message
            if (marriageStatusSelect.value != marriageStatusId) {
                console.warn(
                    `Could not set marriage status to ID ${marriageStatusId}`
                );
                showToast(
                    "warning",
                    "The employee's marriage status could not be loaded properly. Please select it manually."
                );
            }
        } else {
            marriageStatusSelect.value = "";
        }

        // Add employee level and marriage status display in title or subtitle if they exist
        let subtitle = "";
        if (employee.level_employee) {
            subtitle += `Level: ${employee.level_employee.name}`;
        }

        if (employee.marriage_status) {
            subtitle += subtitle
                ? ` | Status: ${
                      employee.marriage_status.description ||
                      employee.marriage_status.code
                  }`
                : `Status: ${
                      employee.marriage_status.description ||
                      employee.marriage_status.code
                  }`;
        }

        // Update modal title
        document.getElementById("employeeModalTitle").textContent =
            "Edit Employee";

        // Add subtitle if we have one
        const subtitleEl = document.querySelector(
            "#employeeModal .modal-subtitle"
        );
        if (subtitle) {
            if (!subtitleEl) {
                const titleEl = document.getElementById("employeeModalTitle");
                const newSubtitle = document.createElement("div");
                newSubtitle.className = "modal-subtitle text-muted small mt-1";
                newSubtitle.textContent = subtitle;
                titleEl.parentNode.appendChild(newSubtitle);
            } else {
                subtitleEl.textContent = subtitle;
                subtitleEl.style.display = "block";
            }
        } else if (subtitleEl) {
            subtitleEl.style.display = "none";
        }

        // Clear any previous validation errors
        clearValidationErrors();

        // Show modal
        const modal = new bootstrap.Modal(
            document.getElementById("employeeModal")
        );
        modal.show();
    } catch (error) {
        console.error("Error loading employee details:", error);

        const formattedError =
            EmployeeApi.DataTransformer.formatErrorForDisplay(error);
        showToast(
            "error",
            formattedError.message || "Failed to load employee details"
        );

        if (error.status === 404) {
            // Employee not found, refresh the list
            await loadEmployees();
        }
    } finally {
        const saveButton = document.getElementById("saveEmployee");
        toggleButtonLoading(saveButton, false);
    }
}

/**
 * Open the modal for viewing an employee's details
 * @param {string|number} employeeId - The ID of the employee to view
 */
async function openViewEmployeeModal(employeeId) {
    try {
        // This could be implemented later with a dedicated view modal
        // For now, we'll just use the edit modal in read-only mode

        await openEditEmployeeModal(employeeId);

        // Make all form fields read-only
        const formElements = document.getElementById("employeeForm").elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }

        // Update modal title
        document.getElementById("employeeModalTitle").textContent =
            "Employee Details";

        // Hide save button
        document.getElementById("saveEmployee").style.display = "none";
    } catch (error) {
        showToast("error", "Failed to load employee details");
        console.error("Error loading employee details:", error);
    }
}

/**
 * Open the delete confirmation modal
 * @param {string|number} employeeId - The ID of the employee to delete
 * @param {string} employeeName - The name of the employee to delete
 */
function openDeleteConfirmationModal(employeeId, employeeName) {
    state.currentEmployeeId = employeeId;

    // Set employee name in confirmation message
    document.getElementById("deleteEmployeeName").textContent = employeeName;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
    modal.show();
}

/**
 * Handle the employee form submission (create or update)
 */
async function handleEmployeeFormSubmit() {
    try {
        // Cek dan pastikan data marriage statuses sudah di-load
        if (state.marriageStatuses.length === 0) {
            // Jika belum ada data marriage status, load dulu dari API
            console.log("Loading marriage statuses before form submission");
            await loadMarriageStatuses();

            // Jika setelah loading masih kosong, batalkan submission
            if (state.marriageStatuses.length === 0) {
                showToast(
                    "error",
                    "Could not load marriage status data. Please reload the page and try again."
                );
                return;
            }
        }

        // Validasi khusus untuk memastikan marriage status dipilih
        const marriageStatusSelect = document.getElementById("marriageStatus");
        if (!marriageStatusSelect.value) {
            // Validasi gagal: Marriage status harus dipilih
            marriageStatusSelect.classList.add("is-invalid");
            let feedback = marriageStatusSelect.nextElementSibling;
            if (!feedback || !feedback.classList.contains("invalid-feedback")) {
                feedback = document.createElement("div");
                feedback.classList.add("invalid-feedback");
                marriageStatusSelect.parentNode.appendChild(feedback);
            }
            feedback.textContent =
                "Marriage status is required. Please select a valid option.";
            marriageStatusSelect.focus();

            // Tampilkan toast error
            showToast(
                "error",
                "Marriage status is required. Please select a value before saving."
            );
            return; // Stop form submission
        }

        if (!validateEmployeeForm()) return;

        const saveButton = document.getElementById("saveEmployee");
        const form = document.getElementById("employeeForm");

        // Disable all form fields
        disableFormFields(form, true);

        // Show loading state
        toggleButtonLoading(saveButton, true);

        // Get selected marriage status ID - pastikan nilainya valid
        const marriageStatusId = parseInt(marriageStatusSelect.value, 10);
        if (isNaN(marriageStatusId)) {
            showToast(
                "error",
                "Invalid marriage status value. Please select a valid option."
            );
            toggleButtonLoading(saveButton, false);
            disableFormFields(form, false);
            return;
        }

        // Gather form data - pastikan marriage_status_id adalah integer
        const employeeData = {
            nik: document.getElementById("nik").value,
            name: document.getElementById("name").value,
            department: document.getElementById("department").value,
            gender: document.getElementById("gender").value,
            level_employee_id: parseInt(
                document.getElementById("level").value,
                10
            ),
            marriage_status_id: marriageStatusId,
        };

        // Log data yang akan dikirim ke server
        console.log("Submitting employee data:", employeeData);

        let response;

        if (state.modalMode === "add") {
            // Create new employee
            response = await EmployeeApi.createEmployee(employeeData);
            showToast("success", "Employee created successfully");
        } else {
            // Update existing employee
            response = await EmployeeApi.updateEmployee(
                state.currentEmployeeId,
                employeeData
            );
            showToast("success", "Employee updated successfully");
        }

        // Close modal
        bootstrap.Modal.getInstance(
            document.getElementById("employeeModal")
        ).hide();

        // Reload employee list
        await loadEmployees();
    } catch (error) {
        console.error("Error saving employee:", error);

        // Jika error berasal dari validasi internal kita
        if (
            error.message &&
            error.message.includes("Marriage status is required")
        ) {
            showToast("error", error.message);

            // Highlight field
            const marriageStatusSelect =
                document.getElementById("marriageStatus");
            marriageStatusSelect.classList.add("is-invalid");
            marriageStatusSelect.focus();
            return;
        }

        // Use the formatted error from DataTransformer
        const formattedError =
            EmployeeApi.DataTransformer.formatErrorForDisplay(error);

        // Create detailed error message
        let errorMessage = formattedError.message || "Failed to save employee";

        // Handle validation errors
        if (error.status === 400 && error.data?.errors) {
            errorMessage = "Please correct the validation errors";
            displayValidationErrors(error.data.errors);
        } else if (error.status === 401) {
            errorMessage = "Your session has expired. Please log in again.";
            handleSessionExpiration();
        } else if (error.status === 403) {
            errorMessage = "You don't have permission to perform this action.";
        } else if (error.status === 409) {
            errorMessage =
                error.data?.message ||
                "A conflict occurred with existing data.";
        } else if (error.status === 500) {
            errorMessage = "Server error occurred. Please try again later.";
            // Log detailed error info
            console.error("Server error details:", error.data);

            // Cek apakah ini masalah marriage status
            if (
                error.data &&
                error.data.error &&
                error.data.error.includes("marriage status id")
            ) {
                errorMessage =
                    "Marriage status is required. Please select a valid marriage status.";

                // Tampilkan semua marriage status yang tersedia untuk debugging
                console.log(
                    "Available marriage statuses:",
                    state.marriageStatuses
                );

                // Highlight the field
                const marriageStatusSelect =
                    document.getElementById("marriageStatus");
                marriageStatusSelect.classList.add("is-invalid");
                let feedback = marriageStatusSelect.nextElementSibling;
                if (
                    !feedback ||
                    !feedback.classList.contains("invalid-feedback")
                ) {
                    feedback = document.createElement("div");
                    feedback.classList.add("invalid-feedback");
                    marriageStatusSelect.parentNode.appendChild(feedback);
                }
                feedback.textContent = "Please select a valid marriage status.";

                // Coba refresh data marriage status
                loadMarriageStatuses();
            }
        } else if (error.message === "Failed to fetch" || !navigator.onLine) {
            errorMessage =
                "Network connection issue. Check your internet connection.";
        }

        showToast("error", errorMessage);
    } finally {
        const saveButton = document.getElementById("saveEmployee");
        const form = document.getElementById("employeeForm");

        // Re-enable form fields
        disableFormFields(form, false);

        // Hide loading state
        toggleButtonLoading(saveButton, false);
    }
}

/**
 * Handle the delete confirmation
 */
async function handleDeleteConfirmation() {
    try {
        const deleteButton = document.getElementById("confirmDelete");
        toggleButtonLoading(deleteButton, true);

        // Delete employee
        await EmployeeApi.deleteEmployee(state.currentEmployeeId);

        // Close modal
        bootstrap.Modal.getInstance(
            document.getElementById("deleteModal")
        ).hide();

        // Show success message
        showToast("success", "Employee deleted successfully");

        // Reload employee list
        await loadEmployees();
    } catch (error) {
        console.error("Error deleting employee:", error);

        // Create detailed error message
        let errorMessage = "Failed to delete employee";

        if (error.status === 401) {
            errorMessage = "Your session has expired. Please log in again.";
        } else if (error.status === 403) {
            errorMessage = "You don't have permission to delete this employee.";
        } else if (error.status === 404) {
            errorMessage =
                "The employee you're trying to delete could not be found.";
        } else if (error.status === 409) {
            errorMessage =
                "This employee cannot be deleted because they have associated records.";
        } else if (error.message === "Failed to fetch" || !navigator.onLine) {
            errorMessage =
                "Network connection issue. Check your internet connection.";
        }

        showToast("error", errorMessage);
    } finally {
        const deleteButton = document.getElementById("confirmDelete");
        toggleButtonLoading(deleteButton, false);
    }
}

/**
 * Disable or enable all form fields
 * @param {HTMLFormElement} form - The form element
 * @param {boolean} disabled - Whether to disable or enable
 */
function disableFormFields(form, disabled) {
    Array.from(form.elements).forEach((element) => {
        // Skip buttons (we handle those separately)
        if (element.tagName === "BUTTON") return;

        // Skip hidden fields
        if (element.type === "hidden") return;

        element.disabled = disabled;

        // Add visual indication for disabled state
        if (disabled) {
            element.classList.add("disabled-field");
        } else {
            element.classList.remove("disabled-field");
        }
    });
}

/**
 * Display validation errors from the API
 * @param {Object} errors - Validation errors from API
 */
function displayValidationErrors(errors) {
    clearValidationErrors();

    // Create a summary of errors for screen readers
    const errorSummary = document.createElement("div");
    errorSummary.className = "alert alert-danger validation-summary";
    errorSummary.setAttribute("role", "alert");
    errorSummary.innerHTML =
        "<h6>Please correct the following errors:</h6><ul></ul>";
    const errorList = errorSummary.querySelector("ul");

    // Display each error on the corresponding field
    Object.keys(errors).forEach((field) => {
        const errorMessage = errors[field][0];

        // Add to summary
        const listItem = document.createElement("li");
        listItem.textContent = errorMessage;
        errorList.appendChild(listItem);

        // Find the field
        const input = document.getElementById(field);
        if (!input) return;

        // Mark as invalid
        input.classList.add("is-invalid");

        // Find or create error message element
        let feedback = input.nextElementSibling;
        if (!feedback || !feedback.classList.contains("invalid-feedback")) {
            feedback = document.createElement("div");
            feedback.classList.add("invalid-feedback");
            input.parentNode.appendChild(feedback);
        }

        // Set error message
        feedback.textContent = errorMessage;

        // Add event listeners to clear validation error when user interacts with the field
        input.addEventListener(
            "input",
            () => {
                input.classList.remove("is-invalid");
                if (feedback) feedback.textContent = "";
            },
            { once: true }
        );
    });

    // Add summary to the form if there are errors
    if (Object.keys(errors).length > 0) {
        const form = document.getElementById("employeeForm");
        form.insertBefore(errorSummary, form.firstChild);
    }
}

/**
 * Set up form validation
 */
function setupFormValidation() {
    const form = document.getElementById("employeeForm");

    if (!form) return;

    // Add event listener for form inputs to provide interactive validation feedback
    form.querySelectorAll("input, select").forEach((input) => {
        input.addEventListener("blur", function () {
            // Only validate if the form has been attempted to be submitted once
            if (form.classList.contains("was-validated")) {
                validateInput(this);
            }
        });

        input.addEventListener("change", function () {
            // Only validate if the form has been attempted to be submitted once
            if (form.classList.contains("was-validated")) {
                validateInput(this);
            }
        });
    });
}

/**
 * Validate a single input field
 * @param {HTMLElement} input - The input element to validate
 * @returns {boolean} Whether the input is valid
 */
function validateInput(input) {
    if (!input) return false;

    // Check validity
    const isValid = input.checkValidity();

    // Update UI
    if (isValid) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }

    return isValid;
}

/**
 * Validate the employee form before submission
 * @returns {boolean} Whether the form is valid
 */
function validateEmployeeForm() {
    const form = document.getElementById("employeeForm");

    // Add the was-validated class to enable Bootstrap validation styles
    form.classList.add("was-validated");

    // Validate each input manually
    let isValid = true;
    form.querySelectorAll("input, select").forEach((input) => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    // Special validation for marriage status
    const marriageStatusSelect = document.getElementById("marriageStatus");
    if (marriageStatusSelect && !marriageStatusSelect.value) {
        marriageStatusSelect.classList.add("is-invalid");
        isValid = false;

        // Focus on the first invalid element
        if (!form.querySelector(".is-invalid:focus")) {
            marriageStatusSelect.focus();
        }
    }

    // If the form is invalid, focus the first invalid field
    if (!isValid) {
        const firstInvalid = form.querySelector(".is-invalid");
        if (firstInvalid) {
            firstInvalid.focus();

            // Scroll to the invalid field if needed
            firstInvalid.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }

    return isValid;
}

/**
 * Clear all validation errors
 */
function clearValidationErrors() {
    // Remove all validation classes
    const form = document.getElementById("employeeForm");

    if (!form) return;

    // Remove was-validated class
    form.classList.remove("was-validated");

    // Remove validation classes from inputs
    form.querySelectorAll(".is-invalid, .is-valid").forEach((input) => {
        input.classList.remove("is-invalid");
        input.classList.remove("is-valid");
    });
}

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach((tooltip) => {
        new bootstrap.Tooltip(tooltip);
    });
}

/**
 * Show or hide loading state for the table
 * @param {boolean} show - Whether to show or hide loading
 */
function showTableLoader(show) {
    state.loading = show;

    // Get table body
    const tableBody = document.querySelector(".employee-table tbody");

    if (show) {
        // Clear existing content
        tableBody.innerHTML = "";

        // Create skeleton rows
        for (let i = 0; i < state.pagination.perPage; i++) {
            const row = document.createElement("tr");
            row.className = "skeleton-row";
            row.innerHTML = `
                <td><div class="skeleton-loader skeleton-text"></div></td>
                <td><div class="skeleton-loader skeleton-text"></div></td>
                <td><div class="skeleton-loader skeleton-text"></div></td>
                <td><div class="skeleton-loader skeleton-text"></div></td>
                <td><div class="skeleton-loader skeleton-text"></div></td>
                <td><div class="skeleton-loader skeleton-text"></div></td>
                <td><div class="skeleton-loader skeleton-action"></div></td>
            `;
            tableBody.appendChild(row);
        }

        // Show overlay
        const tableContainer = document.querySelector(".table-responsive");
        if (!tableContainer.querySelector(".table-loader")) {
            const loader = document.createElement("div");
            loader.className = "table-loader";
            loader.innerHTML = `
                <div class="loader-overlay">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            tableContainer.appendChild(loader);
        }
    } else {
        // Hide loader
        const tableContainer = document.querySelector(".table-responsive");
        const loader = tableContainer.querySelector(".table-loader");
        if (loader) {
            loader.remove();
        }
    }
}

/**
 * Show or hide loading state for the entire page
 * @param {boolean} show - Whether to show or hide loading
 */
function showPageLoader(show) {
    // Implement page loader UI state
    let loader = document.querySelector(".page-loader");

    if (show) {
        // Show loader
        if (!loader) {
            loader = document.createElement("div");
            loader.className = "page-loader";
            loader.innerHTML = `
                <div class="loader-overlay full-page">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
    } else {
        // Hide loader
        if (loader) {
            loader.remove();
        }
    }
}

/**
 * Toggle loading state for a button
 * @param {HTMLElement} button - The button element
 * @param {boolean} isLoading - Whether the button is in loading state
 */
function toggleButtonLoading(button, isLoading) {
    const spinner = button.querySelector(".spinner-border");

    if (isLoading) {
        button.disabled = true;
        spinner.classList.remove("d-none");
    } else {
        button.disabled = false;
        spinner.classList.add("d-none");
    }
}

/**
 * Show a toast notification
 * @param {string} type - The type of toast ('success', 'error', 'info', 'warning')
 * @param {string} message - The message to display
 */
function showToast(type, message) {
    // Check if we're using SweetAlert2
    if (typeof Swal !== "undefined") {
        const iconMap = {
            success: "success",
            error: "error",
            info: "info",
            warning: "warning",
        };

        Swal.fire({
            icon: iconMap[type] || "info",
            title: type.charAt(0).toUpperCase() + type.slice(1),
            text: message,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        return;
    }

    // Fallback to simple alert if SweetAlert2 is not available
    alert(`${type.toUpperCase()}: ${message}`);
}

/**
 * Show an offline error message
 */
function showOfflineError() {
    const tableBody = document.querySelector(".employee-table tbody");
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <div class="offline-state">
                    <i class="bi bi-wifi-off fs-1 mb-3"></i>
                    <h5>You are offline</h5>
                    <p>We can't connect to the server right now. Please check your internet connection and try again.</p>
                    <button class="btn btn-primary mt-3" onclick="loadEmployees()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Retry Connection
                    </button>
                </div>
            </td>
        </tr>
    `;

    // Also update pagination to show we're offline
    document.querySelector(".pagination-info").textContent =
        "Offline mode - Connection lost";
    document.getElementById("prevPage").disabled = true;
    document.getElementById("nextPage").disabled = true;
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
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

/**
 * Check if this is first-time use (no employees in the system)
 * @returns {boolean} Whether this is first-time use
 */
function isFirstTimeUse() {
    // If we have a saved flag in localStorage, use that
    const hasSeenFtux = localStorage.getItem("employee_ftux_seen") === "true";
    if (hasSeenFtux) return false;

    // Otherwise check if employees list is empty with no active filters
    const hasNoEmployees = state.employees.length === 0;
    const hasNoFilters = Object.values(state.filters).every((val) => !val);
    const isFirstPage = state.pagination.currentPage === 1;

    return hasNoEmployees && hasNoFilters && isFirstPage;
}

/**
 * Show first-time user experience banner
 */
function showFirstTimeBanner() {
    // Check if banner already exists
    if (document.querySelector(".ftux-banner")) return;

    // Create banner
    const banner = document.createElement("div");
    banner.className = "ftux-banner";
    banner.innerHTML = `
        <div class="icon">
            <i class="bi bi-info-circle-fill"></i>
        </div>
        <div class="content">
            <h5>Welcome to Employee Management</h5>
            <p>Get started by adding your first employee. This will allow you to manage employee information, 
            track benefits, and more.</p>
            <button class="btn btn-primary btn-sm" onclick="openAddEmployeeModal()">
                <i class="bi bi-plus-circle me-1"></i>Add Your First Employee
            </button>
        </div>
        <button type="button" class="btn-close" onclick="dismissFirstTimeBanner()"></button>
    `;

    // Insert banner at the top of the content area
    const contentArea = document.querySelector(".card-body");
    contentArea.insertBefore(banner, contentArea.firstChild);

    // Add special highlight to the empty state
    setTimeout(() => {
        const emptyState = document.querySelector(".empty-state");
        if (emptyState) {
            emptyState.classList.add("first-time");
        }
    }, 500);
}

/**
 * Dismiss the first-time user experience banner
 */
function dismissFirstTimeBanner() {
    const banner = document.querySelector(".ftux-banner");
    if (banner) {
        banner.style.opacity = "0";
        banner.style.height = "0";
        banner.style.margin = "0";
        banner.style.padding = "0";
        banner.style.overflow = "hidden";
        setTimeout(() => banner.remove(), 500);
    }

    // Save dismissal in localStorage
    localStorage.setItem("employee_ftux_seen", "true");

    // Remove highlight from empty state
    const emptyState = document.querySelector(".empty-state");
    if (emptyState) {
        emptyState.classList.remove("first-time");
    }
}
