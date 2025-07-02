/**
 * Form Validation
 *
 * Handles comprehensive form validation for claims processing
 */

class FormValidation {
    constructor() {
        this.form = document.getElementById("newClaimForm");
        this.validationRules = {
            benefitTypeSelect: {
                required: true,
                message: "Please select a benefit type",
            },
            claimAmount: {
                required: true,
                min: 1000,
                message: "Please enter a valid claim amount (minimum Rp 1,000)",
            },
            claimDate: {
                required: true,
                dateRange: true,
                message: "Please select a valid claim date",
            },
            documentVerificationCheck: {
                required: true,
                message: "Please confirm document verification is completed",
            },
        };

        this.init();
    }

    init() {
        this.bindValidationEvents();
        this.setupRealTimeValidation();
    }

    bindValidationEvents() {
        // Form submission validation - Remove duplicate handler since claims-processing-main.js already handles it
        // Instead, provide validation method that can be called by main handler
        // this.form.addEventListener("submit", (e) => {
        //     if (!this.validateForm()) {
        //         e.preventDefault();
        //         e.stopPropagation();
        //     }
        //     this.form.classList.add("was-validated");
        // });

        // Real-time field validation
        Object.keys(this.validationRules).forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Skip blur event for claimAmount to prevent unwanted formatting
                if (fieldId !== "claimAmount") {
                    field.addEventListener("blur", () =>
                        this.validateField(fieldId)
                    );
                }
                field.addEventListener("change", () =>
                    this.validateField(fieldId)
                );
            }
        });

        // Special handling for claim date
        const claimDate = document.getElementById("claimDate");
        claimDate.addEventListener("input", () => this.validateClaimDate());
    }

    setupRealTimeValidation() {
        // Benefit type validation
        document
            .getElementById("benefitTypeSelect")
            .addEventListener("change", (e) => {
                this.validateBenefitType(e.target.value);
            });

        // Amount validation with balance check
        document
            .getElementById("claimAmount")
            .addEventListener("input", (e) => {
                this.validateClaimAmount(e.target.value);
            });

        // Document verification
        document
            .getElementById("documentVerificationCheck")
            .addEventListener("change", (e) => {
                this.validateDocumentVerification(e.target.checked);
            });
    }

    validateForm() {
        let isValid = true;
        let errorMessage = "";

        // Validate all fields
        Object.keys(this.validationRules).forEach((fieldId) => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        // Additional custom validations
        if (!this.validateEmployeeSelection()) {
            isValid = false;
            errorMessage = "Please select an employee first";
        }

        if (isValid && !this.validateBalanceAvailability()) {
            isValid = false;
            errorMessage = "Please check benefit type and amount";
        }

        // If validation fails, show error but don't prevent anything here
        // Let the main handler deal with prevention
        if (!isValid && errorMessage) {
            console.warn("Form validation failed:", errorMessage);
        }

        return isValid;
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const rules = this.validationRules[fieldId];

        if (!field || !rules) return true;

        let isValid = true;
        let errorMessage = "";

        // Required validation
        if (rules.required) {
            if (field.type === "checkbox") {
                isValid = field.checked;
            } else {
                isValid = field.value.trim() !== "";
            }

            if (!isValid) {
                errorMessage = rules.message;
            }
        }

        // Specific field validations
        if (isValid) {
            switch (fieldId) {
                case "claimAmount":
                    const result = this.validateClaimAmountValue(field.value);
                    isValid = result.isValid;
                    errorMessage = result.message;
                    break;

                case "claimDate":
                    const dateResult = this.validateClaimDateValue(field.value);
                    isValid = dateResult.isValid;
                    errorMessage = dateResult.message;
                    break;
            }
        }

        // Update field UI
        this.updateFieldValidation(field, isValid, errorMessage);

        return isValid;
    }

    validateBenefitType(value) {
        const field = document.getElementById("benefitTypeSelect");
        const isValid = value !== "";
        const message = isValid ? "" : "Please select a benefit type";

        this.updateFieldValidation(field, isValid, message);
        return isValid;
    }

    validateClaimAmount(value) {
        const field = document.getElementById("claimAmount");
        const result = this.validateClaimAmountValue(value);

        this.updateFieldValidation(field, result.isValid, result.message);
        return result.isValid;
    }

    validateClaimAmountValue(value) {
        const amount = parseInt(value.toString().replace(/[^\d]/g, "")) || 0;

        if (amount < 1000) {
            return {
                isValid: false,
                message: "Minimum claim amount is Rp 1,000",
            };
        }

        if (amount > 50000000) {
            // 50 million limit
            return {
                isValid: false,
                message: "Maximum claim amount is Rp 50,000,000",
            };
        }

        // Check balance availability if calculator is available
        if (window.balanceCalculator) {
            const validation = window.balanceCalculator.getValidationStatus();
            if (
                validation.selectedBenefitType &&
                amount > validation.currentBalance
            ) {
                return {
                    isValid: false,
                    message: `Insufficient balance. Available: ${this.formatCurrency(
                        validation.currentBalance
                    )}`,
                };
            }
        }

        return { isValid: true, message: "" };
    }

    validateClaimDate() {
        const field = document.getElementById("claimDate");
        const result = this.validateClaimDateValue(field.value);

        this.updateFieldValidation(field, result.isValid, result.message);
        return result.isValid;
    }

    validateClaimDateValue(value) {
        if (!value) {
            return {
                isValid: false,
                message: "Please select a claim date",
            };
        }

        const claimDate = new Date(value);
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Reset time to compare dates only
        today.setHours(23, 59, 59, 999);
        claimDate.setHours(0, 0, 0, 0);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        if (claimDate > today) {
            return {
                isValid: false,
                message: "Claim date cannot be in the future",
            };
        }

        if (claimDate < thirtyDaysAgo) {
            return {
                isValid: false,
                message: "Claim date cannot be older than 30 days",
            };
        }

        return { isValid: true, message: "" };
    }

    validateDocumentVerification(checked) {
        const field = document.getElementById("documentVerificationCheck");
        const isValid = checked;
        const message = isValid
            ? ""
            : "Please confirm that document verification is completed";

        this.updateFieldValidation(field, isValid, message);
        return isValid;
    }

    validateEmployeeSelection() {
        // Check multiple sources for employee selection
        const isValid =
            (window.employeeSearch &&
                window.employeeSearch.getSelectedEmployee()) ||
            (window.claimsApp && window.claimsApp.currentEmployee);

        // Don't show error modal here - let main handler deal with it
        if (!isValid) {
            console.warn("Employee selection validation failed");
        }

        return isValid;
    }

    validateBalanceAvailability() {
        if (!window.balanceCalculator) return true;

        const validation = window.balanceCalculator.getValidationStatus();

        if (!validation.selectedBenefitType) {
            this.showValidationError("Please select a benefit type");
            return false;
        }

        if (!validation.isValid) {
            this.showValidationError(
                "Please enter a valid claim amount within available balance"
            );
            return false;
        }

        return true;
    }

    updateFieldValidation(field, isValid, message) {
        // Remove existing validation classes
        field.classList.remove("is-valid", "is-invalid");

        // Add appropriate validation class
        if (isValid) {
            field.classList.add("is-valid");
        } else {
            field.classList.add("is-invalid");
        }

        // Update feedback message
        this.updateFeedbackMessage(field, message, isValid);

        // Trigger validation change event
        const event = new CustomEvent("fieldValidated", {
            detail: {
                field: field.id,
                isValid: isValid,
                message: message,
            },
        });
        document.dispatchEvent(event);
    }

    updateFeedbackMessage(field, message, isValid) {
        // Find or create feedback element
        let feedback = field.parentElement.querySelector(".invalid-feedback");
        if (!feedback) {
            feedback = document.createElement("div");
            feedback.className = "invalid-feedback";
            field.parentElement.appendChild(feedback);
        }

        // Update message
        feedback.textContent = message;

        // Show/hide feedback
        if (!isValid && message) {
            feedback.style.display = "block";
        } else {
            feedback.style.display = "none";
        }
    }

    showValidationError(message) {
        // You can customize this to show errors in a specific way
        console.error("Validation Error:", message);

        // Could integrate with SweetAlert or another notification system
        if (window.Swal) {
            Swal.fire({
                icon: "error",
                title: "Validation Error",
                text: message,
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });
        }
    }

    resetValidation() {
        // Remove validation classes from all fields
        Object.keys(this.validationRules).forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove("is-valid", "is-invalid");

                // Hide feedback messages
                const feedback =
                    field.parentElement.querySelector(".invalid-feedback");
                if (feedback) {
                    feedback.style.display = "none";
                }
            }
        });

        // Remove form validation class
        this.form.classList.remove("was-validated");
    }

    getValidationSummary() {
        const summary = {
            isValid: true,
            errors: [],
            fields: {},
        };

        Object.keys(this.validationRules).forEach((fieldId) => {
            const isValid = this.validateField(fieldId);
            summary.fields[fieldId] = isValid;

            if (!isValid) {
                summary.isValid = false;
                summary.errors.push(
                    `${fieldId}: ${this.validationRules[fieldId].message}`
                );
            }
        });

        return summary;
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    window.formValidation = new FormValidation();
});
