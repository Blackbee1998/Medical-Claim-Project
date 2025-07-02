/**
 * Employee Search Functionality
 *
 * Handles employee search with autocomplete, keyboard navigation, and selection
 */

class EmployeeSearch {
    constructor() {
        console.log("🏗️ EmployeeSearch: Constructor called");
        this.searchInput = document.getElementById("employeeSearch");
        this.clearBtn = document.getElementById("clearSearchBtn");
        this.resultsDropdown = document.getElementById("searchResultsDropdown");

        console.log("🔍 EmployeeSearch: Elements found:", {
            searchInput: !!this.searchInput,
            clearBtn: !!this.clearBtn,
            resultsDropdown: !!this.resultsDropdown,
        });

        this.selectedEmployee = null;
        this.searchResults = [];
        this.selectedIndex = -1;
        this.searchTimeout = null;
        this.isSearching = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardNavigation();
    }

    bindEvents() {
        console.log("🔗 EmployeeSearch: Binding events...");

        // Search input events
        this.searchInput.addEventListener("input", (e) => {
            console.log("📝 EmployeeSearch: Input event triggered");
            this.handleSearchInput(e.target.value);
        });

        this.searchInput.addEventListener("focus", () => {
            console.log("🎯 EmployeeSearch: Focus event triggered");
            if (
                this.searchInput.value.length >= 2 &&
                this.searchResults.length > 0
            ) {
                this.showResults();
            }
        });

        this.searchInput.addEventListener("blur", () => {
            console.log("🔄 EmployeeSearch: Blur event triggered");
            // Delay hiding to allow click events on results
            setTimeout(() => this.hideResults(), 150);
        });

        // Clear button event
        this.clearBtn.addEventListener("click", () => {
            console.log("🧹 EmployeeSearch: Clear button clicked");
            this.clearSearch();
        });

        // Click outside to close
        document.addEventListener("click", (e) => {
            if (
                !this.searchInput.contains(e.target) &&
                !this.resultsDropdown.contains(e.target)
            ) {
                this.hideResults();
            }
        });

        console.log("✅ EmployeeSearch: Events bound successfully");
    }

    setupKeyboardNavigation() {
        this.searchInput.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    this.navigateResults(1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    this.navigateResults(-1);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (this.selectedIndex >= 0) {
                        this.selectEmployee(
                            this.searchResults[this.selectedIndex]
                        );
                    }
                    break;
                case "Escape":
                    this.hideResults();
                    this.searchInput.blur();
                    break;
            }
        });
    }

    async handleSearchInput(query) {
        console.log(
            "⌨️ EmployeeSearch: handleSearchInput called with query:",
            query
        );

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Show/hide clear button
        if (query.length > 0) {
            this.clearBtn.classList.remove("d-none");
        } else {
            this.clearBtn.classList.add("d-none");
            this.hideResults();
            return;
        }

        // Minimum 2 characters to search
        if (query.length < 2) {
            console.log(
                "📏 EmployeeSearch: Query too short, minimum 2 characters required"
            );
            this.hideResults();
            return;
        }

        console.log("⏰ EmployeeSearch: Setting timeout for search...");
        // Debounce search
        this.searchTimeout = setTimeout(async () => {
            await this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        try {
            console.log(
                "🔍 EmployeeSearch: performSearch called with query:",
                query
            );
            this.isSearching = true;
            this.showLoadingState();

            console.log(
                "📞 EmployeeSearch: Calling ClaimsProcessingAPI.searchEmployees"
            );

            // Check if ClaimsProcessingAPI is available
            if (
                !window.ClaimsProcessingAPI ||
                !window.ClaimsProcessingAPI.searchEmployees
            ) {
                console.error(
                    "❌ EmployeeSearch: ClaimsProcessingAPI.searchEmployees not available"
                );
                throw new Error(
                    "ClaimsProcessingAPI.searchEmployees not available"
                );
            }

            const response = await window.ClaimsProcessingAPI.searchEmployees(
                query
            );
            console.log("📨 EmployeeSearch: Response received:", response);

            this.searchResults = response.data || [];
            this.selectedIndex = -1;

            console.log(
                "📊 EmployeeSearch: Search results:",
                this.searchResults
            );
            this.renderResults();
            this.showResults();
        } catch (error) {
            console.error("❌ EmployeeSearch: Search error:", error);
            this.showErrorState();
        } finally {
            this.isSearching = false;
        }
    }

    renderResults() {
        if (this.searchResults.length === 0) {
            this.resultsDropdown.innerHTML = `
                <div class="no-results">
                    <i class="bi bi-search mb-2"></i>
                    <p class="mb-0">No employees found</p>
                    <small class="text-muted">Try adjusting your search terms</small>
                </div>
            `;
            return;
        }

        const resultsHtml = this.searchResults
            .map(
                (employee, index) => `
            <div class="search-result-item" data-index="${index}" data-employee-id="${
                    employee.id
                }">
                <div class="employee-result-card">
                    <div class="employee-result-avatar">
                        ${this.getEmployeeInitials(employee.name)}
                    </div>
                    <div class="employee-result-details">
                        <h6>${this.highlightMatch(employee.name)}</h6>
                        <p class="employee-result-meta">
                            ${this.highlightMatch(employee.nik)} • ${
                    employee.department
                } • ${employee.level}
                        </p>
                    </div>
                </div>
            </div>
        `
            )
            .join("");

        this.resultsDropdown.innerHTML = resultsHtml;

        // Bind click events
        this.resultsDropdown
            .querySelectorAll(".search-result-item")
            .forEach((item) => {
                item.addEventListener("click", () => {
                    const employeeId = parseInt(item.dataset.employeeId);
                    const employee = this.searchResults.find(
                        (emp) => emp.id === employeeId
                    );
                    this.selectEmployee(employee);
                });
            });
    }

    showLoadingState() {
        this.resultsDropdown.innerHTML = `
            <div class="search-loading p-3 text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <small class="text-muted ms-2">Searching employees...</small>
            </div>
        `;
        this.showResults();
    }

    showErrorState() {
        this.resultsDropdown.innerHTML = `
            <div class="search-error p-3 text-center">
                <i class="bi bi-exclamation-triangle text-warning mb-2"></i>
                <p class="mb-0 text-muted">Search failed</p>
                <small class="text-muted">Please check console for details and try again</small>
            </div>
        `;
        this.showResults();
    }

    navigateResults(direction) {
        if (this.searchResults.length === 0) return;

        // Remove previous selection
        this.clearResultSelection();

        // Calculate new index
        this.selectedIndex += direction;

        // Wrap around
        if (this.selectedIndex >= this.searchResults.length) {
            this.selectedIndex = 0;
        } else if (this.selectedIndex < 0) {
            this.selectedIndex = this.searchResults.length - 1;
        }

        // Highlight selected item
        const selectedItem = this.resultsDropdown.querySelector(
            `[data-index="${this.selectedIndex}"]`
        );
        if (selectedItem) {
            selectedItem.classList.add("selected");
            selectedItem.scrollIntoView({ block: "nearest" });
        }
    }

    clearResultSelection() {
        this.resultsDropdown
            .querySelectorAll(".search-result-item")
            .forEach((item) => {
                item.classList.remove("selected");
            });
    }

    selectEmployee(employee) {
        this.selectedEmployee = employee;
        this.searchInput.value = `${employee.name} (${employee.nik})`;
        this.hideResults();
        this.clearBtn.classList.remove("d-none");

        // Trigger employee selection event
        this.onEmployeeSelected(employee);
    }

    onEmployeeSelected(employee) {
        // Trigger custom event
        const event = new CustomEvent("employeeSelected", {
            detail: { employee },
        });
        document.dispatchEvent(event);

        console.log("Employee selected:", employee);
    }

    clearSearch() {
        this.searchInput.value = "";
        this.clearBtn.classList.add("d-none");
        this.hideResults();
        this.selectedEmployee = null;
        this.searchResults = [];
        this.selectedIndex = -1;

        // Trigger clear event
        const event = new CustomEvent("employeeCleared");
        document.dispatchEvent(event);

        // Focus back to search input
        this.searchInput.focus();
    }

    showResults() {
        this.resultsDropdown.classList.add("show");
    }

    hideResults() {
        this.resultsDropdown.classList.remove("show");
        this.clearResultSelection();
        this.selectedIndex = -1;
    }

    getEmployeeInitials(name) {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    highlightMatch(text) {
        const query = this.searchInput.value.toLowerCase();
        if (!query || query.length < 2) return text;

        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    }

    // Public methods
    getSelectedEmployee() {
        return this.selectedEmployee;
    }

    resetSearch() {
        this.clearSearch();
    }

    setEmployee(employee) {
        this.selectEmployee(employee);
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 EmployeeSearch: DOM Content Loaded, initializing...");
    try {
        window.employeeSearch = new EmployeeSearch();
        console.log("✅ EmployeeSearch: Initialized successfully");
    } catch (error) {
        console.error("❌ EmployeeSearch: Initialization failed:", error);
    }
});
