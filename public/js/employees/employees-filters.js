/**
 * Employee Filters Module
 * Handles all filter operations for the employee management page
 */

const EmployeeFilters = (function () {
    // Private variables
    let _departments = [];
    let _onFilterChange = null;

    /**
     * Initialize the filter module
     * @param {Function} onFilterChangeCallback - Callback when filters change
     */
    function init(onFilterChangeCallback) {
        _onFilterChange = onFilterChangeCallback;
        setupEventListeners();
    }

    /**
     * Set up event listeners for filter controls
     */
    function setupEventListeners() {
        // Apply filters button
        document
            .getElementById("applyFiltersBtn")
            .addEventListener("click", applyFilters);

        // Clear filters button
        document
            .getElementById("clearFiltersBtn")
            .addEventListener("click", clearFilters);

        // Search with debounce
        const searchInput = document.getElementById("searchInput");
        searchInput.addEventListener(
            "input",
            debounce(() => {
                applyFilters();
            }, 300)
        );
    }

    /**
     * Gather all filter values from the UI
     * @returns {Object} The filter values
     */
    function getFilterValues() {
        return {
            search: document.getElementById("searchInput").value,
            department: document.getElementById("departmentFilter").value,
            level_employee_id: document.getElementById("levelFilter").value,
            marriage_status_id: document.getElementById("marriageFilter").value,
            gender: document.getElementById("genderFilter").value,
        };
    }

    /**
     * Apply all current filters and notify callback
     */
    function applyFilters() {
        if (_onFilterChange) {
            _onFilterChange(getFilterValues());
        }
    }

    /**
     * Clear all filters and reset the form
     */
    function clearFilters() {
        // Reset filter form
        document.getElementById("departmentFilter").value = "";
        document.getElementById("levelFilter").value = "";
        document.getElementById("marriageFilter").value = "";
        document.getElementById("genderFilter").value = "";
        document.getElementById("searchInput").value = "";

        // Notify callback
        if (_onFilterChange) {
            _onFilterChange(getFilterValues());
        }
    }

    /**
     * Populate the department filter dropdown
     * @param {Array} employees - List of employees to extract departments from
     */
    function populateDepartmentFilter(employees) {
        if (!Array.isArray(employees) || employees.length === 0) return;

        // Extract unique departments
        const departmentSet = new Set();
        employees.forEach((employee) => {
            if (employee.department) {
                departmentSet.add(employee.department);
            }
        });

        const departments = Array.from(departmentSet).sort();
        _departments = departments;

        // Populate dropdown
        const dropdown = document.getElementById("departmentFilter");
        if (!dropdown) return;

        // Save current selection
        const currentValue = dropdown.value;

        // Clear and add default option
        dropdown.innerHTML =
            '<option value="" selected>All Departments</option>';

        // Add options from data
        departments.forEach((department) => {
            const option = document.createElement("option");
            option.value = department;
            option.textContent = department;
            dropdown.appendChild(option);
        });

        // Restore selection if it exists in new options
        if (currentValue) {
            // Check if the value exists in the new options
            const exists = Array.from(dropdown.options).some(
                (option) => option.value === currentValue
            );

            if (exists) {
                dropdown.value = currentValue;
            }
        }

        // Also populate the form department dropdown
        populateFormDepartmentDropdown();
    }

    /**
     * Populate the department dropdown in the employee form
     */
    function populateFormDepartmentDropdown() {
        if (!_departments || _departments.length === 0) return;

        const formDropdown = document.getElementById("department");
        if (!formDropdown) return;

        // Save current selection
        const currentValue = formDropdown.value;

        // Clear and add default option
        formDropdown.innerHTML = '<option value="">Select Department</option>';

        // Add options from the departments array
        _departments.forEach((department) => {
            const option = document.createElement("option");
            option.value = department;
            option.textContent = department;
            formDropdown.appendChild(option);
        });

        // Restore selection if it exists in new options
        if (currentValue) {
            // Check if the value exists in the new options
            const exists = Array.from(formDropdown.options).some(
                (option) => option.value === currentValue
            );

            if (exists) {
                formDropdown.value = currentValue;
            }
        }
    }

    /**
     * Set filter values programmatically
     * @param {Object} filters - Filter values to set
     */
    function setFilterValues(filters) {
        if (!filters) return;

        if (filters.search !== undefined) {
            document.getElementById("searchInput").value = filters.search;
        }

        if (filters.department !== undefined) {
            document.getElementById("departmentFilter").value =
                filters.department;
        }

        if (filters.level_employee_id !== undefined) {
            document.getElementById("levelFilter").value =
                filters.level_employee_id;
        }

        if (filters.marriage_status_id !== undefined) {
            document.getElementById("marriageFilter").value =
                filters.marriage_status_id;
        }

        if (filters.gender !== undefined) {
            document.getElementById("genderFilter").value = filters.gender;
        }
    }

    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce delay in milliseconds
     * @returns {Function} The debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public API
    return {
        init,
        applyFilters,
        clearFilters,
        getFilterValues,
        setFilterValues,
        populateDepartmentFilter,
        populateFormDepartmentDropdown,
    };
})();
