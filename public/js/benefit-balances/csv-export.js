/**
 * CSV Export Utility for Employee Benefit Balances
 *
 * Generates and downloads CSV files from employee benefit balances data
 */

// Convert array of objects to CSV string
function objectsToCsv(data) {
    if (!data || !data.length) {
        return "";
    }

    // Get all column headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV header row
    let csvContent = headers.join(",") + "\n";

    // Add data rows
    data.forEach((item) => {
        const row = headers.map((header) => {
            // Get the value for this header
            let value = item[header];

            // Format the value for CSV
            // If it contains commas, quotes, or newlines, wrap in quotes and escape existing quotes
            if (value === null || value === undefined) {
                value = "";
            } else {
                value = String(value);

                // If the value contains quotes, commas, or newlines, escape and wrap in quotes
                if (
                    value.includes('"') ||
                    value.includes(",") ||
                    value.includes("\n")
                ) {
                    // Escape quotes by doubling them
                    value = value.replace(/"/g, '""');
                    // Wrap in quotes
                    value = `"${value}"`;
                }
            }

            return value;
        });

        // Add row to CSV content
        csvContent += row.join(",") + "\n";
    });

    return csvContent;
}

// Generate and download CSV file
function downloadCsv(data, filename) {
    // Generate CSV content
    const csvContent = objectsToCsv(data);

    // Create a Blob containing the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link
    const link = document.createElement("a");

    // Create object URL for the Blob
    const url = URL.createObjectURL(blob);

    // Set link properties
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    // Append link to document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Export filtered benefit balances to CSV
function exportBenefitBalancesToCsv(filters = {}) {
    // Get the data to export (using the mock data function from benefit-balances-mock-data.js)
    const csvData = exportToCsvData(filters);

    // Generate filename with current date
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10); // YYYY-MM-DD format
    const filename = `benefit_balances_${dateString}.csv`;

    // Download the CSV file
    downloadCsv(csvData, filename);

    // Return success indicator
    return {
        success: true,
        filename: filename,
        rowCount: csvData.length,
    };
}
