/**
 * Employee Selector
 *
 * Handles employee selection with pre-loaded data and local search filtering
 */

class EmployeeSelector {
    constructor() {
        console.log("🏗️ EmployeeSelector: Constructor called");
        this.employeeSelect = document.getElementById("employeeSelect");
        this.selectedEmployee = null;
        this.allEmployees = [];
        this.isLoading = false;

        console.log("🔍 EmployeeSelector: Elements found:", {
            employeeSelect: !!this.employeeSelect,
        });

        this.init();
    }

    init() {
        console.log("🚀 EmployeeSelector: Initializing...");
        this.bindEvents();
        this.loadAllEmployees();
    }

    bindEvents() {
        console.log("🔗 EmployeeSelector: Binding events...");

        // Employee selection change
        this.employeeSelect.addEventListener("change", (e) => {
            console.log("📝 EmployeeSelector: Selection changed");
            this.handleEmployeeSelection(e.target.value);
        });

        console.log("✅ EmployeeSelector: Events bound successfully");
    }

    async loadAllEmployees() {
        try {
            console.log("📊 EmployeeSelector: Loading all employees...");
            this.isLoading = true;
            this.showLoadingState();

            // Fetch all employees with pagination
            const response = await this.fetchAllEmployees();
            this.allEmployees = response.data || [];

            console.log(
                "✅ EmployeeSelector: Loaded employees:",
                this.allEmployees.length
            );
            this.populateEmployeeOptions();
        } catch (error) {
            console.error(
                "❌ EmployeeSelector: Failed to load employees:",
                error
            );
            this.showErrorState();
        } finally {
            this.isLoading = false;
        }
    }

    async fetchAllEmployees() {
        try {
            // Fetch with high per_page to get all employees
            const response = await fetch(
                `/api/v1/employees?per_page=1000&sort_by=name&sort_dir=asc`,
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

            return await response.json();
        } catch (error) {
            console.error("❌ EmployeeSelector: API error:", error);
            throw error;
        }
    }

    populateEmployeeOptions() {
        // Clear existing options
        this.employeeSelect.innerHTML =
            '<option value="">Select an employee...</option>';

        // Add employee options
        this.allEmployees.forEach((employee) => {
            const option = document.createElement("option");
            option.value = employee.id;
            option.textContent = `${employee.name} (${employee.nik}) - ${employee.department}`;
            option.dataset.employeeData = JSON.stringify(employee);
            this.employeeSelect.appendChild(option);
        });

        // Enable the select
        this.employeeSelect.disabled = false;
    }

    showLoadingState() {
        this.employeeSelect.innerHTML =
            '<option value="">Loading employees...</option>';
        this.employeeSelect.disabled = true;
    }

    showErrorState() {
        this.employeeSelect.innerHTML =
            '<option value="">Failed to load employees. Please refresh the page.</option>';
        this.employeeSelect.disabled = true;
    }

    handleEmployeeSelection(employeeId) {
        if (!employeeId) {
            this.selectedEmployee = null;
            this.triggerEmployeeCleared();
            return;
        }

        // Find selected employee
        const employee = this.allEmployees.find((emp) => emp.id == employeeId);
        if (employee) {
            this.selectedEmployee = employee;
            console.log("👤 EmployeeSelector: Employee selected:", employee);
            this.triggerEmployeeSelected(employee);
        }
    }

    triggerEmployeeSelected(employee) {
        // Add validation state
        this.employeeSelect.classList.remove("is-invalid");
        this.employeeSelect.classList.add("is-valid");

        // Trigger custom event
        const event = new CustomEvent("employeeSelected", {
            detail: { employee },
        });
        document.dispatchEvent(event);

        console.log("✅ EmployeeSelector: Employee selection event triggered");
    }

    triggerEmployeeCleared() {
        // Remove validation state
        this.employeeSelect.classList.remove("is-valid", "is-invalid");

        // Trigger clear event
        const event = new CustomEvent("employeeCleared");
        document.dispatchEvent(event);

        console.log("🧹 EmployeeSelector: Employee cleared event triggered");
    }

    // Public methods
    getSelectedEmployee() {
        return this.selectedEmployee;
    }

    clearSelection() {
        this.employeeSelect.value = "";
        this.handleEmployeeSelection("");
    }

    setEmployee(employee) {
        const option = Array.from(this.employeeSelect.options).find(
            (opt) => opt.value == employee.id
        );
        if (option) {
            this.employeeSelect.value = employee.id;
            this.handleEmployeeSelection(employee.id);
        }
    }

    // Validation method
    isValid() {
        return !!this.selectedEmployee;
    }

    showValidationError() {
        this.employeeSelect.classList.add("is-invalid");
        this.employeeSelect.classList.remove("is-valid");
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 EmployeeSelector: DOM Content Loaded, initializing...");
    try {
        window.employeeSelector = new EmployeeSelector();
        console.log("✅ EmployeeSelector: Initialized successfully");
    } catch (error) {
        console.error("❌ EmployeeSelector: Initialization failed:", error);
    }
});
