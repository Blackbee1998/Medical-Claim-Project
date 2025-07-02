/**
 * Employee Benefit Balances - Mock Data
 *
 * Mock data for frontend development and testing before backend integration
 */

// Sample benefit types
const benefitTypes = [
    { id: 1, name: "Medical Insurance" },
    { id: 2, name: "Dental Care" },
    { id: 3, name: "Vision Care" },
    { id: 4, name: "Mental Health Support" },
    { id: 5, name: "Wellness Program" },
];

// Sample employees
const employees = [
    { id: 1, name: "John Doe", nik: "EMP001", department: "IT" },
    { id: 2, name: "Jane Smith", nik: "EMP002", department: "HR" },
    { id: 3, name: "Mike Johnson", nik: "EMP003", department: "Finance" },
    { id: 4, name: "Sarah Williams", nik: "EMP004", department: "Marketing" },
    { id: 5, name: "David Brown", nik: "EMP005", department: "Operations" },
    { id: 6, name: "Emily Davis", nik: "EMP006", department: "IT" },
    { id: 7, name: "Robert Wilson", nik: "EMP007", department: "HR" },
    { id: 8, name: "Jessica Taylor", nik: "EMP008", department: "Finance" },
    { id: 9, name: "Thomas Anderson", nik: "EMP009", department: "Marketing" },
    { id: 10, name: "Lisa Martinez", nik: "EMP010", department: "Operations" },
    { id: 11, name: "Daniel Clark", nik: "EMP011", department: "IT" },
    { id: 12, name: "Michelle Lewis", nik: "EMP012", department: "HR" },
    { id: 13, name: "Kevin Hall", nik: "EMP013", department: "Finance" },
    { id: 14, name: "Laura Walker", nik: "EMP014", department: "Marketing" },
    { id: 15, name: "Steven White", nik: "EMP015", department: "Operations" },
];

// Generate employee benefit balances with various balance levels
const generateBenefitBalances = () => {
    const currentYear = new Date().getFullYear();
    const balances = [];

    // For each employee
    employees.forEach((employee) => {
        // For each benefit type
        benefitTypes.forEach((benefitType) => {
            // Initial balance varies by benefit type
            let initialBalance;
            switch (benefitType.id) {
                case 1: // Medical Insurance
                    initialBalance = 10000000; // 10 million
                    break;
                case 2: // Dental Care
                    initialBalance = 5000000; // 5 million
                    break;
                case 3: // Vision Care
                    initialBalance = 3000000; // 3 million
                    break;
                case 4: // Mental Health Support
                    initialBalance = 4000000; // 4 million
                    break;
                case 5: // Wellness Program
                    initialBalance = 2000000; // 2 million
                    break;
                default:
                    initialBalance = 5000000;
            }

            // Generate random current balance between 0% and 100% of initial
            // Use employee ID as a seed for variety
            const seed = employee.id * benefitType.id;
            const percentRemaining = (seed % 100) / 100;
            const currentBalance = Math.round(
                initialBalance * percentRemaining
            );
            const usagePercentage = Math.round((1 - percentRemaining) * 100);

            // Generate random last updated date in the past 6 months
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const lastUpdatedDate = new Date(
                sixMonthsAgo.getTime() +
                    Math.random() * (today.getTime() - sixMonthsAgo.getTime())
            );

            balances.push({
                id: balances.length + 1,
                employee: employee,
                benefitType: benefitType,
                year: currentYear,
                initialBalance: initialBalance,
                currentBalance: currentBalance,
                usagePercentage: usagePercentage,
                lastUpdated: lastUpdatedDate.toISOString(),
            });
        });
    });

    return balances;
};

// Generate all benefit balances
const benefitBalances = generateBenefitBalances();

// Mock pagination function
const paginateBenefitBalances = (page = 1, perPage = 10, filters = {}) => {
    let filteredBalances = [...benefitBalances];

    // Apply filters
    if (filters.employeeId) {
        filteredBalances = filteredBalances.filter(
            (b) => b.employee.id === parseInt(filters.employeeId)
        );
    }

    if (filters.benefitTypeId) {
        filteredBalances = filteredBalances.filter(
            (b) => b.benefitType.id === parseInt(filters.benefitTypeId)
        );
    }

    if (filters.year) {
        filteredBalances = filteredBalances.filter(
            (b) => b.year === parseInt(filters.year)
        );
    }

    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredBalances = filteredBalances.filter(
            (b) =>
                b.employee.name.toLowerCase().includes(query) ||
                b.employee.nik.toLowerCase().includes(query) ||
                b.employee.department.toLowerCase().includes(query)
        );
    }

    // Calculate pagination
    const totalItems = filteredBalances.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedBalances = filteredBalances.slice(startIndex, endIndex);

    return {
        data: paginatedBalances,
        pagination: {
            total: totalItems,
            perPage: perPage,
            currentPage: page,
            lastPage: totalPages,
            from: startIndex + 1,
            to: Math.min(endIndex, totalItems),
        },
    };
};

// Generate summary statistics
const getSummaryStatistics = (filters = {}) => {
    let filteredBalances = [...benefitBalances];

    // Apply filters
    if (filters.employeeId) {
        filteredBalances = filteredBalances.filter(
            (b) => b.employee.id === parseInt(filters.employeeId)
        );
    }

    if (filters.benefitTypeId) {
        filteredBalances = filteredBalances.filter(
            (b) => b.benefitType.id === parseInt(filters.benefitTypeId)
        );
    }

    if (filters.year) {
        filteredBalances = filteredBalances.filter(
            (b) => b.year === parseInt(filters.year)
        );
    }

    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredBalances = filteredBalances.filter(
            (b) =>
                b.employee.name.toLowerCase().includes(query) ||
                b.employee.nik.toLowerCase().includes(query) ||
                b.employee.department.toLowerCase().includes(query)
        );
    }

    // Calculate statistics
    const uniqueEmployees = new Set(filteredBalances.map((b) => b.employee.id))
        .size;
    const totalBudget = filteredBalances.reduce(
        (sum, b) => sum + b.initialBalance,
        0
    );
    const totalRemaining = filteredBalances.reduce(
        (sum, b) => sum + b.currentBalance,
        0
    );

    // Calculate average usage percentage
    const averageUsage =
        filteredBalances.length > 0
            ? Math.round(
                  filteredBalances.reduce(
                      (sum, b) => sum + b.usagePercentage,
                      0
                  ) / filteredBalances.length
              )
            : 0;

    return {
        employeeCount: uniqueEmployees,
        totalBudget: totalBudget,
        totalRemaining: totalRemaining,
        averageUsage: averageUsage,
    };
};

// Export CSV data (returns array of objects for CSV generation)
const exportToCsvData = (filters = {}) => {
    let filteredBalances = [...benefitBalances];

    // Apply filters
    if (filters.employeeId) {
        filteredBalances = filteredBalances.filter(
            (b) => b.employee.id === parseInt(filters.employeeId)
        );
    }

    if (filters.benefitTypeId) {
        filteredBalances = filteredBalances.filter(
            (b) => b.benefitType.id === parseInt(filters.benefitTypeId)
        );
    }

    if (filters.year) {
        filteredBalances = filteredBalances.filter(
            (b) => b.year === parseInt(filters.year)
        );
    }

    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredBalances = filteredBalances.filter(
            (b) =>
                b.employee.name.toLowerCase().includes(query) ||
                b.employee.nik.toLowerCase().includes(query) ||
                b.employee.department.toLowerCase().includes(query)
        );
    }

    // Format data for CSV
    return filteredBalances.map((b) => ({
        NIK: b.employee.nik,
        "Employee Name": b.employee.name,
        Department: b.employee.department,
        "Benefit Type": b.benefitType.name,
        Year: b.year,
        "Initial Balance": b.initialBalance,
        "Current Balance": b.currentBalance,
        "Usage Percentage": b.usagePercentage + "%",
        "Last Updated": new Date(b.lastUpdated).toLocaleDateString(),
    }));
};

// Initialize balances mock function
const initializeBalances = (year, employees = []) => {
    return new Promise((resolve) => {
        // Simulate API delay
        setTimeout(() => {
            // Return success response
            resolve({
                success: true,
                message: `Successfully initialized benefit balances for ${
                    employees.length || "all"
                } employees for year ${year}`,
                count: employees.length || 15, // all employees if none specified
            });
        }, 1500); // 1.5 second delay
    });
};
