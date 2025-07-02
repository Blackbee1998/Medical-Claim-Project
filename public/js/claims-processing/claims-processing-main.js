/**
 * Claims Processing - Main Application
 *
 * Main controller that orchestrates all claims processing functionality
 */

class ClaimsProcessingApp {
    constructor() {
        this.currentEmployee = null;
        this.formState = {
            isValid: false,
            documentVerified: false,
            balanceValid: false,
            employeeSelected: false,
        };

        this.init();
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.loadInitialData();
        this.setupFormValidation();
    }

    initElements() {
        // Sections
        this.employeeSummarySection = document.getElementById(
            "employeeSummarySection"
        );
        this.claimProcessingForm = document.getElementById(
            "claimProcessingForm"
        );

        // Employee display elements
        this.selectedEmployeeName = document.getElementById(
            "selectedEmployeeName"
        );
        this.selectedEmployeeNik = document.getElementById(
            "selectedEmployeeNik"
        );
        this.selectedEmployeeDepartment = document.getElementById(
            "selectedEmployeeDepartment"
        );
        this.selectedEmployeeLevel = document.getElementById(
            "selectedEmployeeLevel"
        );
        this.benefitsGrid = document.getElementById("benefitsGrid");

        // Form elements
        this.newClaimForm = document.getElementById("newClaimForm");
        this.claimDate = document.getElementById("claimDate");
        this.claimDescription = document.getElementById("claimDescription");
        this.documentVerificationCheck = document.getElementById(
            "documentVerificationCheck"
        );
        this.processClaimBtn = document.getElementById("processClaimBtn");

        // Action buttons
        this.viewFullHistoryBtn = document.getElementById("viewFullHistoryBtn");
        this.processNewClaimBtn = document.getElementById("processNewClaimBtn");
        this.clearFormBtn = document.getElementById("clearFormBtn");
        this.saveAsDraftBtn = document.getElementById("saveAsDraftBtn");

        // Recent claims
        this.recentClaimsList = document.getElementById("recentClaimsList");
        this.todayClaimsCount = document.getElementById("todayClaimsCount");

        // Modals
        this.successModal = new bootstrap.Modal(
            document.getElementById("successModal")
        );
        this.insufficientBalanceModal = new bootstrap.Modal(
            document.getElementById("insufficientBalanceModal")
        );
    }

    bindEvents() {
        // Employee selection events
        document.addEventListener("employeeSelected", (e) => {
            this.handleEmployeeSelected(e.detail.employee);
        });

        document.addEventListener("employeeCleared", () => {
            this.handleEmployeeCleared();
        });

        // Amount validation events
        document.addEventListener("amountValidated", (e) => {
            this.handleAmountValidated(e.detail);
        });

        // Form events
        this.newClaimForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Button events
        this.processNewClaimBtn.addEventListener("click", () => {
            this.showClaimForm();
        });

        this.clearFormBtn.addEventListener("click", () => {
            this.clearForm();
        });

        this.saveAsDraftBtn.addEventListener("click", () => {
            this.saveAsDraft();
        });

        this.viewFullHistoryBtn.addEventListener("click", () => {
            window.location.href = "/dashboard/claims-history";
        });

        // Document verification checkbox
        this.documentVerificationCheck.addEventListener("change", (e) => {
            this.formState.documentVerified = e.target.checked;
            this.updateFormValidation();
        });

        // Description character counter
        this.claimDescription.addEventListener("input", (e) => {
            this.updateCharacterCounter(e.target);
        });

        // Set default claim date
        this.claimDate.value = new Date().toISOString().split("T")[0];
    }

    async loadInitialData() {
        try {
            // Load today's claims count
            const countResponse =
                await window.ClaimsProcessingAPI.getTodayClaimsCount();
            this.todayClaimsCount.textContent = countResponse.count;

            // Load recent claims activity
            await this.loadRecentClaimsActivity();
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadRecentClaimsActivity() {
        try {
            const response =
                await window.ClaimsProcessingAPI.getRecentClaimsActivity();
            this.renderRecentClaims(response.data);
        } catch (error) {
            console.error("Error loading recent claims:", error);
            this.showEmptyRecentClaims();
        }
    }

    handleEmployeeSelected(employee) {
        this.currentEmployee = employee;
        this.formState.employeeSelected = true;

        // Show employee summary section
        this.showEmployeeSummary(employee);

        // Update form validation
        this.updateFormValidation();
    }

    handleEmployeeCleared() {
        this.currentEmployee = null;
        this.formState.employeeSelected = false;

        // Hide sections
        this.hideEmployeeSummary();
        this.hideClaimForm();

        // Update form validation
        this.updateFormValidation();
    }

    async showEmployeeSummary(employee) {
        try {
            // Update employee display
            this.selectedEmployeeName.textContent = employee.name;
            this.selectedEmployeeNik.textContent = employee.nik;
            this.selectedEmployeeDepartment.textContent = employee.department;
            this.selectedEmployeeLevel.textContent = employee.level;

            // Get benefit summary
            const response =
                await window.ClaimsProcessingAPI.getEmployeeBenefitSummary(
                    employee.id
                );

            console.log("📋 Full API response:", response);
            console.log(
                "📊 benefit_balances from response:",
                response.benefit_balances
            );

            this.renderBenefitBalances(response.benefit_balances);

            // Show section with animation
            this.employeeSummarySection.classList.remove("d-none");
            setTimeout(() => {
                this.employeeSummarySection.style.opacity = "1";
                this.employeeSummarySection.style.transform = "translateY(0)";
            }, 100);
        } catch (error) {
            console.error("Error showing employee summary:", error);
            this.showError("Failed to load employee information");
        }
    }

    hideEmployeeSummary() {
        this.employeeSummarySection.classList.add("d-none");
        this.employeeSummarySection.style.opacity = "0";
        this.employeeSummarySection.style.transform = "translateY(-20px)";
    }

    renderBenefitBalances(balances) {
        console.log("🎨 renderBenefitBalances called with:", balances);
        console.log("🔍 Balances type:", typeof balances);
        console.log("🔍 Balances is array:", Array.isArray(balances));
        console.log("🔍 Balances length:", balances?.length);

        if (!balances || balances.length === 0) {
            console.warn("⚠️ No balances to render - showing empty message");
            this.benefitsGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No benefit balances found for this employee.
                    </div>
                </div>
            `;
            return;
        }

        console.log(
            "✅ Proceeding to render",
            balances.length,
            "balance cards"
        );

        const balanceCards = balances
            .map((balance) => {
                const progressBarClass = this.getProgressBarClass(
                    balance.usage_percentage
                );
                const statusIcon = this.getStatusIcon(balance.status);

                return `
                <div class="benefit-card">
                    <div class="benefit-card-header">
                        <h6 class="benefit-type-name">${
                            balance.benefit_type
                        }</h6>
                        ${statusIcon}
                    </div>
                    <div class="benefit-amounts">
                        <div class="amount-row">
                            <span class="amount-label">Initial Budget:</span>
                            <span class="amount-value">${this.formatCurrency(
                                balance.initial_balance
                            )}</span>
                        </div>
                        <div class="amount-row">
                            <span class="amount-label">Used Amount:</span>
                            <span class="amount-value">${this.formatCurrency(
                                balance.used_amount
                            )}</span>
                        </div>
                        <div class="amount-row">
                            <span class="amount-label">Current Balance:</span>
                            <span class="amount-value current-balance">${this.formatCurrency(
                                balance.current_balance
                            )}</span>
                        </div>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress">
                            <div class="progress-bar ${progressBarClass}" style="width: ${
                    balance.usage_percentage
                }%"></div>
                        </div>
                        <div class="usage-percentage">${balance.usage_percentage.toFixed(
                            1
                        )}% used</div>
                    </div>
                </div>
            `;
            })
            .join("");

        this.benefitsGrid.innerHTML = balanceCards;
    }

    showClaimForm() {
        this.claimProcessingForm.classList.remove("d-none");
        setTimeout(() => {
            this.claimProcessingForm.style.opacity = "1";
            this.claimProcessingForm.style.transform = "translateY(0)";
        }, 100);

        // Focus first form field
        document.getElementById("benefitTypeSelect").focus();
    }

    hideClaimForm() {
        this.claimProcessingForm.classList.add("d-none");
        this.claimProcessingForm.style.opacity = "0";
        this.claimProcessingForm.style.transform = "translateY(-20px)";
    }

    handleAmountValidated(validation) {
        this.formState.balanceValid = validation.isValid;
        this.updateFormValidation();

        // Show insufficient balance modal if needed
        if (
            !validation.isValid &&
            validation.claimAmount > 0 &&
            validation.selectedBenefitType
        ) {
            this.showInsufficientBalanceWarning(validation);
        }
    }

    showInsufficientBalanceWarning(validation) {
        const warningContent = document.getElementById("warningContent");
        const shortage = validation.claimAmount - validation.currentBalance;

        warningContent.innerHTML = `
            <div class="text-center mb-3">
                <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
            </div>
            <h6>Insufficient Balance for ${
                validation.selectedBenefitType.benefit_type
            }</h6>
            <p class="text-muted mb-3">The claim amount exceeds the available balance.</p>
            <div class="balance-breakdown">
                <div class="d-flex justify-content-between mb-2">
                    <span>Available Balance:</span>
                    <strong>${this.formatCurrency(
                        validation.currentBalance
                    )}</strong>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Requested Amount:</span>
                    <strong>${this.formatCurrency(
                        validation.claimAmount
                    )}</strong>
                </div>
                <hr>
                <div class="d-flex justify-content-between">
                    <span>Shortage:</span>
                    <strong class="text-danger">${this.formatCurrency(
                        shortage
                    )}</strong>
                </div>
            </div>
        `;

        this.insufficientBalanceModal.show();
    }

    async handleFormSubmit() {
        // Check both internal validation and form validation
        if (!this.validateForm()) {
            console.error("Internal validation failed");
            return;
        }

        // Check form validation if available
        if (window.formValidation && !window.formValidation.validateForm()) {
            console.error("Form validation failed - preventing submission");
            this.showError("Please complete all required fields correctly");
            return;
        }

        try {
            this.setProcessingState(true);

            // Prepare claim data with validation
            const claimData = this.getFormData();

            // Validate claimData before processing
            if (!claimData || !claimData.employee_id) {
                throw new Error(
                    "Invalid claim data: missing employee information"
                );
            }

            if (!claimData.benefit_type_id || !claimData.amount) {
                throw new Error(
                    "Invalid claim data: missing benefit or amount information"
                );
            }

            // Process claim
            const response = await window.ClaimsProcessingAPI.processNewClaim(
                claimData
            );

            // Show success modal
            this.showSuccessModal(response);

            // Update recent claims
            await this.loadRecentClaimsActivity();

            // Update today's count
            const countResponse =
                await window.ClaimsProcessingAPI.getTodayClaimsCount();
            this.todayClaimsCount.textContent = countResponse.count;

            // Clear form
            this.clearForm();
        } catch (error) {
            console.error("Error processing claim:", error);
            this.showError(error.message || "Failed to process claim");
        } finally {
            this.setProcessingState(false);
        }
    }

    getFormData() {
        try {
            // Validate current employee
            if (!this.currentEmployee || !this.currentEmployee.id) {
                throw new Error("No employee selected");
            }

            // Get form elements
            const benefitTypeSelect =
                document.getElementById("benefitTypeSelect");
            const claimDate = this.claimDate;
            const claimDescription = this.claimDescription;

            // Validate form elements exist
            if (!benefitTypeSelect || !claimDate || !claimDescription) {
                throw new Error("Required form elements not found");
            }

            // Validate balance calculator
            if (
                !window.balanceCalculator ||
                typeof window.balanceCalculator.claimAmount === "undefined"
            ) {
                throw new Error(
                    "Balance calculator not available or claim amount not set"
                );
            }

            const formData = {
                employee_id: this.currentEmployee.id,
                benefit_type_id: parseInt(benefitTypeSelect.value),
                amount: window.balanceCalculator.claimAmount,
                claim_date: claimDate.value,
                description: claimDescription.value.trim(),
            };

            // Final validation
            if (
                !formData.employee_id ||
                !formData.benefit_type_id ||
                !formData.amount ||
                !formData.claim_date
            ) {
                throw new Error("Missing required form data");
            }

            return formData;
        } catch (error) {
            console.error("Error preparing form data:", error);
            throw new Error(`Failed to prepare claim data: ${error.message}`);
        }
    }

    validateForm() {
        const validation = window.balanceCalculator.getValidationStatus();

        if (!this.formState.employeeSelected) {
            this.showError("Please select an employee first");
            return false;
        }

        if (!validation.selectedBenefitType) {
            this.showError("Please select a benefit type");
            return false;
        }

        if (!validation.isValid) {
            this.showError("Please enter a valid claim amount");
            return false;
        }

        if (!this.formState.documentVerified) {
            this.showError(
                "Please confirm that document verification is completed"
            );
            return false;
        }

        if (!this.claimDate.value) {
            this.showError("Please select a claim date");
            return false;
        }

        return true;
    }

    setupFormValidation() {
        this.updateFormValidation();
    }

    updateFormValidation() {
        const allValid =
            this.formState.employeeSelected &&
            this.formState.balanceValid &&
            this.formState.documentVerified;

        this.processClaimBtn.disabled = !allValid;
    }

    setProcessingState(isProcessing) {
        const btnText = this.processClaimBtn.querySelector(".btn-text");
        const btnLoading = this.processClaimBtn.querySelector(".btn-loading");

        if (isProcessing) {
            this.processClaimBtn.classList.add("loading");
            this.processClaimBtn.disabled = true;
            btnText.classList.add("d-none");
            btnLoading.classList.remove("d-none");
        } else {
            this.processClaimBtn.classList.remove("loading");
            btnText.classList.remove("d-none");
            btnLoading.classList.add("d-none");
            this.updateFormValidation(); // Re-enable based on validation
        }
    }

    showSuccessModal(response) {
        const successSummary = document.getElementById("successSummary");
        const employee = this.currentEmployee;
        const validation = window.balanceCalculator.getValidationStatus();

        successSummary.innerHTML = `
            <div class="text-center mb-3">
                <i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
            </div>
            <h6 class="text-center mb-3">Claim Processed Successfully!</h6>
            <div class="summary-details">
                <div class="summary-row">
                    <span class="summary-label">Employee:</span>
                    <span class="summary-value">${employee.name} (${
            employee.nik
        })</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Benefit Type:</span>
                    <span class="summary-value">${
                        validation.selectedBenefitType.benefit_type
                    }</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Claim Amount:</span>
                    <span class="summary-value">${this.formatCurrency(
                        validation.claimAmount
                    )}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Remaining Balance:</span>
                    <span class="summary-value">${this.formatCurrency(
                        response.updated_balance
                    )}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Confirmation Number:</span>
                    <span class="summary-value">${
                        response.claim.confirmation_number
                    }</span>
                </div>
            </div>
        `;

        this.successModal.show();
        this.startAutoCloseTimer();
    }

    startAutoCloseTimer() {
        let countdown = 10;
        const countdownElement = document.getElementById("autoCloseCountdown");

        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(timer);
                this.successModal.hide();
            }
        }, 1000);

        // Clear timer if modal is manually closed
        document.getElementById("successModal").addEventListener(
            "hidden.bs.modal",
            () => {
                clearInterval(timer);
            },
            { once: true }
        );
    }

    clearForm() {
        // Reset form
        this.newClaimForm.reset();
        this.claimDate.value = new Date().toISOString().split("T")[0];
        this.documentVerificationCheck.checked = false;

        // Reset validation state
        this.formState.documentVerified = false;
        this.formState.balanceValid = false;

        // Reset balance calculator
        if (window.balanceCalculator) {
            window.balanceCalculator.resetCalculations();
        }

        // Update validation
        this.updateFormValidation();

        // Hide form
        this.hideClaimForm();
    }

    saveAsDraft() {
        // Implementation for save as draft functionality
        console.log("Save as draft functionality not implemented yet");
        this.showInfo(
            "Draft saving functionality will be implemented in future updates"
        );
    }

    renderRecentClaims(claims) {
        if (!claims || claims.length === 0) {
            this.showEmptyRecentClaims();
            return;
        }

        const claimsHtml = claims
            .map(
                (claim) => `
            <div class="recent-claim-item">
                <div class="recent-claim-info">
                    <h6 class="recent-claim-employee">${
                        claim.employee_name
                    }</h6>
                    <p class="recent-claim-details">
                        ${claim.benefit_type} • ${this.formatCurrency(
                    claim.amount
                )} • ${this.formatDate(claim.processed_date)}
                    </p>
                </div>
                <div class="recent-claim-amount">
                    ${this.formatCurrency(claim.amount)}
                </div>
                <div class="recent-claim-status">
                    <span class="badge bg-${window.ClaimsProcessingAPI.getStatusColorClass(
                        claim.status
                    )}">${claim.status}</span>
                </div>
            </div>
        `
            )
            .join("");

        this.recentClaimsList.innerHTML = claimsHtml;
    }

    showEmptyRecentClaims() {
        this.recentClaimsList.innerHTML = `
            <div class="empty-recent-claims">
                <i class="bi bi-inbox"></i>
                <h6>No Recent Claims</h6>
                <p class="text-muted">Recent claim activity will appear here</p>
            </div>
        `;
    }

    updateCharacterCounter(textarea) {
        const maxLength = 500;
        const currentLength = textarea.value.length;
        const counter =
            textarea.parentElement.querySelector(".character-counter");

        counter.textContent = `${currentLength}/${maxLength} characters`;

        // Update counter styling
        counter.className = "character-counter";
        if (currentLength > maxLength * 0.9) {
            counter.classList.add("warning");
        }
        if (currentLength >= maxLength) {
            counter.classList.add("error");
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return window.ClaimsProcessingAPI.formatCurrency(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("id-ID");
    }

    getProgressBarClass(usagePercentage) {
        if (usagePercentage >= 80) return "low";
        if (usagePercentage >= 50) return "medium";
        return "high";
    }

    getStatusIcon(status) {
        const icons = {
            high: '<i class="bi bi-check-circle text-success"></i>',
            medium: '<i class="bi bi-exclamation-triangle text-warning"></i>',
            low: '<i class="bi bi-x-circle text-danger"></i>',
        };
        return icons[status] || "";
    }

    showError(message) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: message,
            confirmButtonColor: "#dc3545",
        });
    }

    showInfo(message) {
        Swal.fire({
            icon: "info",
            title: "Information",
            text: message,
            confirmButtonColor: "#0d6efd",
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    window.claimsProcessingApp = new ClaimsProcessingApp();
    window.claimsApp = window.claimsProcessingApp; // Alias for validation access
});
