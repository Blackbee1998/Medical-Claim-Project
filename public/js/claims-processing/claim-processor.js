/**
 * Claim Processor
 *
 * Handles the claim processing workflow, submission, and response handling
 */

class ClaimProcessor {
    constructor() {
        this.isProcessing = false;
        this.currentClaim = null;
        this.processingSteps = [
            "Validating claim data...",
            "Checking balance availability...",
            "Processing claim...",
            "Updating employee balance...",
            "Generating confirmation...",
        ];
        this.currentStep = 0;

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupProgressTracking();
    }

    bindEvents() {
        // Listen for form submission
        document.addEventListener("claimFormSubmit", (e) => {
            this.processClaim(e.detail.claimData);
        });

        // Listen for processing cancellation
        document.addEventListener("cancelProcessing", () => {
            this.cancelProcessing();
        });

        // Modal events
        this.setupModalHandlers();
    }

    setupModalHandlers() {
        // Success modal handlers
        const processAnotherBtn = document.getElementById(
            "processAnotherClaimBtn"
        );
        const viewClaimDetailsBtn = document.getElementById(
            "viewClaimDetailsBtn"
        );

        if (processAnotherBtn) {
            processAnotherBtn.addEventListener("click", () => {
                this.handleProcessAnother();
            });
        }

        if (viewClaimDetailsBtn) {
            viewClaimDetailsBtn.addEventListener("click", () => {
                this.handleViewClaimDetails();
            });
        }

        // Insufficient balance modal handlers
        const adjustAmountBtn = document.getElementById("adjustAmountBtn");
        if (adjustAmountBtn) {
            adjustAmountBtn.addEventListener("click", () => {
                this.handleAdjustAmount();
            });
        }
    }

    async processClaim(claimData) {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.currentClaim = claimData;
            this.currentStep = 0;

            // Start processing UI
            this.startProcessingUI();

            // Pre-processing validation
            await this.validateClaimData(claimData);
            this.updateProgress(1);

            // Balance verification
            await this.verifyBalance(claimData);
            this.updateProgress(2);

            // Process the claim
            const response = await this.submitClaim(claimData);
            this.updateProgress(3);

            // Update balances and UI
            await this.updatePostProcessing(response);
            this.updateProgress(4);

            // Complete processing
            await this.completeProcessing(response);
            this.updateProgress(5);

            // Show success
            this.showSuccessResult(response);
        } catch (error) {
            this.handleProcessingError(error);
        } finally {
            this.isProcessing = false;
            this.stopProcessingUI();
        }
    }

    async validateClaimData(claimData) {
        // Simulate validation delay
        await this.delay(500);

        // Validate required fields
        if (!claimData.employee_id) {
            throw new Error("Employee is required");
        }

        if (!claimData.benefit_type_id) {
            throw new Error("Benefit type is required");
        }

        if (!claimData.amount || claimData.amount < 1000) {
            throw new Error("Valid claim amount is required");
        }

        if (!claimData.claim_date) {
            throw new Error("Claim date is required");
        }

        // Validate claim date
        const claimDate = new Date(claimData.claim_date);
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        if (claimDate > today) {
            throw new Error("Claim date cannot be in the future");
        }

        if (claimDate < thirtyDaysAgo) {
            throw new Error("Claim date cannot be older than 30 days");
        }

        return true;
    }

    async verifyBalance(claimData) {
        // Simulate balance check delay
        await this.delay(400);

        // Use the balance calculator's validation
        if (window.balanceCalculator) {
            const validation = window.balanceCalculator.getValidationStatus();

            if (!validation.isValid) {
                throw new Error(
                    `Insufficient balance. Available: ${this.formatCurrency(
                        validation.currentBalance
                    )}`
                );
            }

            if (validation.remainingBalance < 0) {
                const shortage = Math.abs(validation.remainingBalance);
                throw new Error(
                    `Claim exceeds available balance by ${this.formatCurrency(
                        shortage
                    )}`
                );
            }
        }

        return true;
    }

    async submitClaim(claimData) {
        // Simulate API call delay
        await this.delay(800);

        // Call the API
        const response = await window.ClaimsProcessingAPI.processNewClaim(
            claimData
        );

        return response;
    }

    async updatePostProcessing(response) {
        // Simulate post-processing delay
        await this.delay(300);

        // Trigger balance update events
        const event = new CustomEvent("claimProcessed", {
            detail: {
                claim: response.claim,
                updatedBalance: response.updated_balance,
            },
        });
        document.dispatchEvent(event);

        return true;
    }

    async completeProcessing(response) {
        // Simulate completion delay
        await this.delay(200);

        // Store successful claim data
        this.currentClaim = response.claim;

        // Clear form
        const event = new CustomEvent("clearClaimForm");
        document.dispatchEvent(event);

        return true;
    }

    startProcessingUI() {
        // Disable form inputs
        this.toggleFormInputs(false);

        // Show processing state on submit button
        const processBtn = document.getElementById("processClaimBtn");
        if (processBtn) {
            processBtn.classList.add("loading");
            processBtn.disabled = true;
        }

        // Show progress indicator if available
        this.showProgressIndicator();
    }

    stopProcessingUI() {
        // Re-enable form inputs
        this.toggleFormInputs(true);

        // Reset submit button
        const processBtn = document.getElementById("processClaimBtn");
        if (processBtn) {
            processBtn.classList.remove("loading");
        }

        // Hide progress indicator
        this.hideProgressIndicator();
    }

    toggleFormInputs(enabled) {
        const form = document.getElementById("newClaimForm");
        if (!form) return;

        const inputs = form.querySelectorAll("input, select, textarea, button");
        inputs.forEach((input) => {
            input.disabled = !enabled;
        });
    }

    showProgressIndicator() {
        // You can implement a progress modal or indicator here
        console.log(
            "Processing claim...",
            this.processingSteps[this.currentStep]
        );
    }

    hideProgressIndicator() {
        // Hide any progress indicators
        console.log("Processing complete");
    }

    updateProgress(step) {
        this.currentStep = step;

        if (step < this.processingSteps.length) {
            console.log(
                `Step ${step + 1}/${this.processingSteps.length}: ${
                    this.processingSteps[step]
                }`
            );
        }

        // Update progress bar if exists
        const progressBar = document.querySelector(".processing-progress-bar");
        if (progressBar) {
            const percentage = ((step + 1) / this.processingSteps.length) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    showSuccessResult(response) {
        // Trigger success event for main app to handle
        const event = new CustomEvent("claimProcessingSuccess", {
            detail: { response },
        });
        document.dispatchEvent(event);
    }

    handleProcessingError(error) {
        console.error("Claim processing error:", error);

        // Trigger error event
        const event = new CustomEvent("claimProcessingError", {
            detail: {
                error: error.message || "An unexpected error occurred",
                originalError: error,
            },
        });
        document.dispatchEvent(event);

        // Show error message
        this.showErrorMessage(error.message || "Failed to process claim");
    }

    showErrorMessage(message) {
        if (window.Swal) {
            Swal.fire({
                icon: "error",
                title: "Processing Failed",
                text: message,
                confirmButtonColor: "#dc3545",
            });
        } else {
            alert("Error: " + message);
        }
    }

    cancelProcessing() {
        if (!this.isProcessing) return;

        // Cancel any ongoing operations
        this.isProcessing = false;
        this.stopProcessingUI();

        // Show cancellation message
        this.showInfoMessage("Claim processing has been cancelled");
    }

    handleProcessAnother() {
        // Close success modal
        const successModal = bootstrap.Modal.getInstance(
            document.getElementById("successModal")
        );
        if (successModal) {
            successModal.hide();
        }

        // Reset form for new claim
        this.resetForNewClaim();
    }

    handleViewClaimDetails() {
        if (!this.currentClaim) return;

        // Redirect to claims history with claim ID
        const claimId = this.currentClaim.id;
        window.location.href = `/dashboard/claims-history?claim=${claimId}`;
    }

    handleAdjustAmount() {
        // Close insufficient balance modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("insufficientBalanceModal")
        );
        if (modal) {
            modal.hide();
        }

        // Focus on amount input
        const amountInput = document.getElementById("claimAmount");
        if (amountInput) {
            amountInput.focus();
            amountInput.select();
        }
    }

    resetForNewClaim() {
        // Clear current claim data
        this.currentClaim = null;
        this.currentStep = 0;

        // Reset progress
        this.updateProgress(0);

        // Clear form validation
        if (window.formValidation) {
            window.formValidation.resetValidation();
        }

        // Focus on employee search
        const employeeSearch = document.getElementById("employeeSearch");
        if (employeeSearch) {
            employeeSearch.focus();
        }
    }

    setupProgressTracking() {
        // Setup any progress tracking UI elements
        this.currentStep = 0;
    }

    getProcessingStatus() {
        return {
            isProcessing: this.isProcessing,
            currentStep: this.currentStep,
            totalSteps: this.processingSteps.length,
            currentStepName: this.processingSteps[this.currentStep] || "",
            currentClaim: this.currentClaim,
        };
    }

    // Utility methods
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    }

    showInfoMessage(message) {
        if (window.Swal) {
            Swal.fire({
                icon: "info",
                title: "Information",
                text: message,
                confirmButtonColor: "#0d6efd",
            });
        } else {
            alert(message);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    window.claimProcessor = new ClaimProcessor();
});
