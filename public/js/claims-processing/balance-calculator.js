/**
 * Balance Calculator
 *
 * Handles real-time balance calculations and visual feedback for claim amounts
 */

class BalanceCalculator {
    constructor() {
        this.currentEmployee = null;
        this.selectedBenefitType = null;
        this.currentBalance = 0;
        this.claimAmount = 0;

        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Form elements
        this.benefitTypeSelect = document.getElementById("benefitTypeSelect");
        this.claimAmountInput = document.getElementById("claimAmount");
        this.maxAmountIndicator = document.getElementById("maxAmountIndicator");

        // Display elements
        this.currentBalanceDisplay = document.getElementById(
            "currentBalanceDisplay"
        );
        this.claimAmountDisplay = document.getElementById("claimAmountDisplay");
        this.remainingBalanceDisplay = document.getElementById(
            "remainingBalanceDisplay"
        );
        this.balanceCalculationDisplay = document.getElementById(
            "balanceCalculationDisplay"
        );

        // Validation elements
        this.balanceValidationIcon = document.getElementById(
            "balanceValidationIcon"
        );
    }

    bindEvents() {
        // Listen for employee selection
        document.addEventListener("employeeSelected", (e) => {
            this.handleEmployeeSelected(e.detail.employee);
        });

        // Listen for employee cleared
        document.addEventListener("employeeCleared", () => {
            this.handleEmployeeCleared();
        });

        // Benefit type selection
        this.benefitTypeSelect.addEventListener("change", (e) => {
            this.handleBenefitTypeChange(e.target.value);
        });

        // Claim amount input
        this.claimAmountInput.addEventListener("input", (e) => {
            this.handleClaimAmountChange(e.target.value);
        });

        // Remove blur formatting to prevent unwanted commas in input
        // this.claimAmountInput.addEventListener("blur", (e) => {
        //     this.formatAmountInput(e.target);
        // });
    }

    async handleEmployeeSelected(employee) {
        this.currentEmployee = employee;

        try {
            // Get employee benefit summary
            const response =
                await window.ClaimsProcessingAPI.getEmployeeBenefitSummary(
                    employee.id
                );
            this.employeeBenefitData = response;

            // Populate benefit types dropdown
            await this.populateBenefitTypes();

            // Reset calculations
            this.resetCalculations();
        } catch (error) {
            console.error("Error loading employee benefits:", error);
            this.showError("Failed to load employee benefit data");
        }
    }

    handleEmployeeCleared() {
        this.currentEmployee = null;
        this.employeeBenefitData = null;
        this.selectedBenefitType = null;
        this.resetCalculations();
        this.clearBenefitTypes();
    }

    async populateBenefitTypes() {
        if (!this.employeeBenefitData) return;

        const benefitBalances = this.employeeBenefitData.benefit_balances || [];

        // Clear existing options
        this.benefitTypeSelect.innerHTML =
            '<option value="">Select benefit type...</option>';

        // Add benefit type options
        benefitBalances.forEach((balance) => {
            const isAvailable = balance.current_balance > 0;
            const formattedBalance = this.formatCurrency(
                balance.current_balance
            );

            const option = document.createElement("option");
            option.value = balance.benefit_type_id;
            option.textContent = `${balance.benefit_type} (${formattedBalance} available)`;
            option.disabled = !isAvailable;

            if (!isAvailable) {
                option.textContent += " - No balance";
                option.style.color = "#dc3545"; // Red color for unavailable
            }

            this.benefitTypeSelect.appendChild(option);
        });
    }

    clearBenefitTypes() {
        this.benefitTypeSelect.innerHTML =
            '<option value="">Select benefit type...</option>';
    }

    handleBenefitTypeChange(benefitTypeId) {
        if (!benefitTypeId || !this.employeeBenefitData) {
            this.selectedBenefitType = null;
            this.currentBalance = 0;
            this.updateCalculationDisplay();
            this.updateMaxAmountIndicator();
            return;
        }

        // Find selected benefit
        const selectedBenefit = this.employeeBenefitData.benefit_balances.find(
            (b) => b.benefit_type_id == benefitTypeId
        );

        if (selectedBenefit) {
            this.selectedBenefitType = selectedBenefit;
            this.currentBalance = selectedBenefit.current_balance;
            this.updateMaxAmountIndicator();
            this.updateCalculationDisplay();

            // Focus claim amount input
            this.claimAmountInput.focus();
        }
    }

    async handleClaimAmountChange(value) {
        // Parse amount
        const amount = this.parseAmount(value);
        this.claimAmount = amount;

        // Update displays
        this.updateCalculationDisplay();

        // Validate with API if we have employee and benefit type selected
        if (this.currentEmployee && this.selectedBenefitType && amount > 0) {
            await this.validateAmountWithAPI();
        } else {
            this.validateAmount();
        }

        // Trigger validation event
        this.triggerValidationEvent();
    }

    updateMaxAmountIndicator() {
        if (!this.selectedBenefitType) {
            this.maxAmountIndicator.textContent = "Select a benefit type first";
            this.maxAmountIndicator.className = "max-amount-indicator";
            return;
        }

        const maxAmount = this.currentBalance;
        const formattedMax = this.formatCurrency(maxAmount);

        if (maxAmount <= 0) {
            this.maxAmountIndicator.textContent = "No balance available";
            this.maxAmountIndicator.className = "max-amount-indicator error";
        } else {
            this.maxAmountIndicator.textContent = `Maximum claimable: ${formattedMax}`;
            this.maxAmountIndicator.className = "max-amount-indicator";
        }
    }

    updateCalculationDisplay() {
        // Update current balance
        this.currentBalanceDisplay.textContent = this.formatCurrency(
            this.currentBalance
        );

        // Update claim amount
        this.claimAmountDisplay.textContent = this.formatCurrency(
            this.claimAmount
        );

        // Calculate remaining balance
        const remainingBalance = this.currentBalance - this.claimAmount;
        this.remainingBalanceDisplay.textContent =
            this.formatCurrency(remainingBalance);

        // Apply styling based on balance status
        this.remainingBalanceDisplay.className = "calculation-value";
        if (remainingBalance < 0) {
            this.remainingBalanceDisplay.classList.add("negative");
        }

        // Show/hide calculation display
        if (this.selectedBenefitType || this.claimAmount > 0) {
            this.balanceCalculationDisplay.style.display = "block";
        } else {
            this.balanceCalculationDisplay.style.display = "none";
        }
    }

    validateAmount() {
        const isValid = this.isAmountValid();
        const input = this.claimAmountInput;

        // Update input validation state
        input.classList.remove("is-valid", "is-invalid");

        if (this.claimAmount > 0) {
            if (isValid) {
                input.classList.add("is-valid");
                this.updateBalanceValidationIcon(true);
            } else {
                input.classList.add("is-invalid");
                this.updateBalanceValidationIcon(false);
                this.showInsufficientBalanceWarning();
            }
        } else {
            this.updateBalanceValidationIcon(null);
        }

        return isValid;
    }

    async validateAmountWithAPI() {
        try {
            const validation =
                await window.ClaimsProcessingAPI.validateClaimAmount(
                    this.currentEmployee.id,
                    this.selectedBenefitType.benefit_type_id,
                    this.claimAmount
                );

            const input = this.claimAmountInput;
            input.classList.remove("is-valid", "is-invalid");

            if (validation.valid) {
                input.classList.add("is-valid");
                this.updateBalanceValidationIcon(true);
            } else {
                input.classList.add("is-invalid");
                this.updateBalanceValidationIcon(false);
                this.showInsufficientBalanceWarning(validation);
            }

            return validation.valid;
        } catch (error) {
            console.error("API validation error:", error);
            // Fallback to local validation
            return this.validateAmount();
        }
    }

    updateBalanceValidationIcon(isValid) {
        if (!this.balanceValidationIcon) return;

        this.balanceValidationIcon.className = "";

        if (isValid === true) {
            this.balanceValidationIcon.className =
                "bi bi-check-circle-fill text-success";
        } else if (isValid === false) {
            this.balanceValidationIcon.className =
                "bi bi-x-circle-fill text-danger";
        } else {
            this.balanceValidationIcon.className =
                "bi bi-check-circle-fill text-success";
        }
    }

    showInsufficientBalanceWarning(validation = null) {
        let message = "";

        if (validation && validation.message) {
            // Use API validation message
            message = validation.message;
            if (validation.shortage_amount > 0) {
                const formattedShortage = this.formatCurrency(
                    validation.shortage_amount
                );
                message += ` Shortage: ${formattedShortage}`;
            }
        } else {
            // Fallback to local calculation
            if (this.claimAmount <= this.currentBalance) return;
            const shortage = this.claimAmount - this.currentBalance;
            const formattedShortage = this.formatCurrency(shortage);
            message = `Insufficient balance. Shortage: ${formattedShortage}`;
        }

        // Update invalid feedback
        let invalidFeedback =
            this.claimAmountInput.parentElement.querySelector(
                ".invalid-feedback"
            );
        if (!invalidFeedback) {
            invalidFeedback = document.createElement("div");
            invalidFeedback.className = "invalid-feedback";
            this.claimAmountInput.parentElement.appendChild(invalidFeedback);
        }

        invalidFeedback.textContent = message;
    }

    isAmountValid() {
        if (!this.selectedBenefitType) return false;
        if (this.claimAmount <= 0) return false;
        return this.claimAmount <= this.currentBalance;
    }

    getRemainingBalance() {
        return this.currentBalance - this.claimAmount;
    }

    getValidationStatus() {
        return {
            isValid: this.isAmountValid(),
            currentBalance: this.currentBalance,
            claimAmount: this.claimAmount,
            remainingBalance: this.getRemainingBalance(),
            selectedBenefitType: this.selectedBenefitType,
        };
    }

    resetCalculations() {
        this.claimAmount = 0;
        this.currentBalance = 0;
        this.selectedBenefitType = null;

        // Reset form
        this.claimAmountInput.value = "";
        this.claimAmountInput.classList.remove("is-valid", "is-invalid");
        this.benefitTypeSelect.value = "";

        // Reset displays
        this.updateCalculationDisplay();
        this.updateMaxAmountIndicator();
        this.updateBalanceValidationIcon(null);

        // Hide calculation display
        this.balanceCalculationDisplay.style.display = "none";
    }

    formatAmountInput(input) {
        const value = this.parseAmount(input.value);
        if (value > 0) {
            input.value = value.toLocaleString("id-ID");
        }
    }

    parseAmount(value) {
        if (!value) return 0;
        // Remove any non-digit characters (including commas, dots, spaces)
        // For Indonesian format, dots are thousand separators, so remove them
        const cleanValue = value.toString().replace(/[^\d]/g, "");
        return parseInt(cleanValue) || 0;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    }

    triggerValidationEvent() {
        const event = new CustomEvent("amountValidated", {
            detail: this.getValidationStatus(),
        });
        document.dispatchEvent(event);
    }

    showError(message) {
        console.error("Balance Calculator Error:", message);
        // Could show a toast or alert here
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    window.balanceCalculator = new BalanceCalculator();
});
