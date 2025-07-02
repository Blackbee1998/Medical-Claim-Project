@extends('layouts.dashboard')

@section('title', 'Process Medical Claims')
@section('page-title', 'Process Medical Claims')

@section('breadcrumbs')
<li class="breadcrumb-item active">Claims Processing</li>
@endsection

@section('content')
<!-- Header Section -->
<div class="row">
    <div class="col-12">
        <div class="card welcome-card mb-4">
            <div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                <div>
                    <h2>Process Medical Claims</h2>
                    <p class="mb-0">Process employee claims after document verification</p>
                </div>
                <div class="mt-3 mt-md-0 d-flex align-items-center">
                    <div class="processing-status me-3">
                        <span class="status-indicator"></span>
                        <span class="status-text">Ready to Process</span>
                    </div>
                    <div class="quick-stats">
                        <small class="text-muted">Claims processed today: <span id="todayClaimsCount">0</span></small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Employee Selection Panel -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card stats-card primary">
            <div class="card-body">
                <h5 class="mb-3">Employee Selection</h5>
                <div class="row g-3">
                    <div class="col-md-12">
                        <label for="employeeSelect" class="form-label">Select Employee <span class="text-danger">*</span></label>
                        <select class="form-select" id="employeeSelect" required>
                            <option value="">Loading employees...</option>
                        </select>
                        <div class="invalid-feedback">Please select an employee</div>
                        <div class="form-text">
                            <small class="text-muted">Choose the employee to process benefit claim for</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Employee Benefit Summary Section -->
<div class="row mb-4 d-none" id="employeeSummarySection">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <!-- Employee Information Card -->
                    <div class="col-md-4">
                        <div class="employee-info-card">
                            <div class="employee-header">
                                <div class="employee-avatar">
                                    <i class="bi bi-person-circle"></i>
                                </div>
                                <div class="employee-details">
                                    <h4 class="employee-name" id="selectedEmployeeName">-</h4>
                                    <p class="employee-nik text-muted" id="selectedEmployeeNik">-</p>
                                    <div class="employee-meta">
                                        <span class="badge bg-light text-dark" id="selectedEmployeeDepartment">-</span>
                                        <span class="badge bg-light text-dark" id="selectedEmployeeLevel">-</span>
                                    </div>
                                    <div class="employee-status mt-2">
                                        <span class="badge bg-success">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit Balances Overview -->
                    <div class="col-md-8">
                        <div class="benefit-balances-overview">
                            <h5 class="mb-3">Benefit Balances Overview</h5>
                            <div class="benefits-grid" id="benefitsGrid">
                                <!-- Benefit cards will be populated by JavaScript -->
                            </div>
                            <div class="quick-actions mt-3">
                                <button type="button" class="btn btn-outline-primary me-2" id="viewFullHistoryBtn">
                                    <i class="bi bi-clock-history me-2"></i>View Full History
                                </button>
                                <button type="button" class="btn btn-primary" id="processNewClaimBtn">
                                    <i class="bi bi-plus-circle me-2"></i>Process New Claim
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Claim Processing Form -->
<div class="row mb-4 d-none" id="claimProcessingForm">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Process New Claim</h5>
            </div>
            <div class="card-body">
                <form id="newClaimForm">
                    <div class="row g-3">
                        <!-- Benefit Type Selection -->
                        <div class="col-md-6">
                            <label for="benefitTypeSelect" class="form-label">Benefit Type <span
                                    class="text-danger">*</span></label>
                            <select class="form-select" id="benefitTypeSelect" required>
                                <option value="">Select benefit type...</option>
                                <!-- Options will be populated by JavaScript -->
                            </select>
                            <div class="invalid-feedback">Please select a benefit type</div>
                        </div>

                        <!-- Claim Amount Input -->
                        <div class="col-md-6">
                            <label for="claimAmount" class="form-label">Claim Amount (IDR) <span
                                    class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="number" class="form-control" id="claimAmount"
                                    placeholder="Enter claim amount..." step="1000" min="1000" required>
                                <div class="invalid-feedback">Please enter a valid claim amount</div>
                            </div>
                            <div class="form-text">
                                <span class="max-amount-indicator" id="maxAmountIndicator">Maximum claimable: -</span>
                            </div>
                        </div>

                        <!-- Real-time Balance Calculation -->
                        <div class="col-12">
                            <div class="balance-calculation-display" id="balanceCalculationDisplay">
                                <div class="calculation-row">
                                    <span class="calculation-label">Current Balance:</span>
                                    <span class="calculation-value" id="currentBalanceDisplay">Rp 0</span>
                                </div>
                                <div class="calculation-row">
                                    <span class="calculation-label">Claim Amount:</span>
                                    <span class="calculation-value" id="claimAmountDisplay">Rp 0</span>
                                </div>
                                <hr class="calculation-divider">
                                <div class="calculation-row total">
                                    <span class="calculation-label">Remaining Balance:</span>
                                    <span class="calculation-value" id="remainingBalanceDisplay">Rp 0</span>
                                </div>
                            </div>
                        </div>

                        <!-- Claim Date -->
                        <div class="col-md-6">
                            <label for="claimDate" class="form-label">Claim Date <span
                                    class="text-danger">*</span></label>
                            <input type="date" class="form-control" id="claimDate" required>
                            <div class="invalid-feedback">Please select a valid claim date</div>
                        </div>

                        <!-- Description -->
                        <div class="col-md-6">
                            <label for="claimDescription" class="form-label">Description</label>
                            <textarea class="form-control" id="claimDescription" rows="1"
                                placeholder="Brief description of medical treatment/expense..."
                                maxlength="500"></textarea>
                            <div class="form-text">
                                <span class="character-counter">0/500 characters</span>
                            </div>
                        </div>
                    </div>

                    <!-- Validation and Feedback Panel -->
                    <div class="validation-panel mt-4">
                        <h6>Pre-submission Checklist</h6>
                        <div class="validation-items">
                            <div class="validation-item">
                                <input type="checkbox" class="form-check-input" id="documentVerificationCheck" required>
                                <label class="form-check-label" for="documentVerificationCheck">
                                    Document verification completed <span class="text-danger">*</span>
                                </label>
                            </div>
                            <div class="validation-item auto-check">
                                <i class="bi bi-check-circle-fill text-success" id="eligibilityCheckIcon"></i>
                                <span>Employee eligibility confirmed</span>
                            </div>
                            <div class="validation-item auto-check">
                                <i class="bi bi-check-circle-fill text-success" id="balanceValidationIcon"></i>
                                <span>Balance validation passed</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="action-buttons mt-4">
                        <button type="button" class="btn btn-secondary me-2" id="clearFormBtn">
                            <i class="bi bi-arrow-clockwise me-2"></i>Clear Form
                        </button>
                        <button type="button" class="btn btn-outline-primary me-2" id="saveAsDraftBtn">
                            <i class="bi bi-bookmark me-2"></i>Save as Draft
                        </button>
                        <button type="submit" class="btn btn-primary" id="processClaimBtn" disabled>
                            <span class="btn-text">
                                <i class="bi bi-check-circle me-2"></i>Process Claim
                            </span>
                            <span class="btn-loading d-none">
                                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                                Processing...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Recent Claims Activity Panel -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Recent Claims Activity</h5>
                <a href="/dashboard/claims-history" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-list-task me-1"></i>View All Claims
                </a>
            </div>
            <div class="card-body">
                <div class="recent-claims-list" id="recentClaimsList">
                    <!-- Recent claims will be populated by JavaScript -->
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Success/Confirmation Modal -->
<div class="modal fade" id="successModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-success text-white">
                <h5 class="modal-title">
                    <i class="bi bi-check-circle me-2"></i>Claim Processed Successfully
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                    aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="success-summary" id="successSummary">
                    <!-- Success details will be populated by JavaScript -->
                </div>
                <div class="auto-close-timer mt-3">
                    <small class="text-muted">This modal will close automatically in <span
                            id="autoCloseCountdown">10</span> seconds</small>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="processAnotherClaimBtn">
                    <i class="bi bi-plus-circle me-2"></i>Process Another Claim
                </button>
                <button type="button" class="btn btn-outline-primary" id="viewClaimDetailsBtn">
                    <i class="bi bi-eye me-2"></i>View Claim Details
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Balance Insufficient Warning Modal -->
<div class="modal fade" id="insufficientBalanceModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
                <h5 class="modal-title">
                    <i class="bi bi-exclamation-triangle me-2"></i>Insufficient Balance
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="warning-content" id="warningContent">
                    <!-- Warning details will be populated by JavaScript -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="adjustAmountBtn">
                    <i class="bi bi-pencil me-2"></i>Adjust Amount
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link rel="stylesheet" href="{{ asset('css/employees/styles.css') }}">
<link rel="stylesheet" href="{{ asset('css/claims-processing.css') }}">
@endpush

@push('scripts')
<!-- Authentication middleware -->
<script src="{{ asset('js/login/auth-middleware.js') }}"></script>

<!-- SweetAlert2 for notifications -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.all.min.js"></script>

<!-- jQuery (required for enhanced functionality) -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Claims processing utilities -->
<script src="{{ asset('js/claims-processing/employee-selector.js') }}"></script>
<script src="{{ asset('js/claims-processing/balance-calculator.js') }}"></script>
<script src="{{ asset('js/claims-processing/form-validation.js') }}"></script>
<script src="{{ asset('js/claims-processing/claim-processor.js') }}"></script>

<!-- API integration layer -->
<script src="{{ asset('js/claims-processing/claims-processing-api.js') }}"></script>

<!-- Main application logic -->
<script src="{{ asset('js/claims-processing/claims-processing-main.js') }}"></script>
@endpush