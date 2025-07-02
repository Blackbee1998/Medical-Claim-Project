@extends('layouts.dashboard')

@section('title', 'Claims History')
@section('page-title', 'Claims History')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Claims History</li>
@endsection

@section('content')
    <!-- Header Section -->
    <div class="row">
        <div class="col-12">
            <div class="card welcome-card mb-4">
                <div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <div>
                        <h2>Claims History</h2>
                        <p class="mb-0">View and manage all processed claims</p>
                    </div>
                    <div class="mt-3 mt-md-0">
                        <a href="/dashboard/claims-processing" class="btn btn-primary">
                            <i class="bi bi-plus-circle me-2"></i>Process New Claim
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Filter and Search Panel -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card stats-card primary">
                <div class="card-body">
                    <h5 class="mb-3">Filter and Search Claims</h5>
                    
                    <!-- Advanced Filters -->
                    <div class="row g-3 mb-3">
                        <div class="col-md-3">
                            <label for="dateFromFilter" class="form-label">From Date</label>
                            <input type="date" class="form-control" id="dateFromFilter">
                        </div>
                        <div class="col-md-3">
                            <label for="dateToFilter" class="form-label">To Date</label>
                            <input type="date" class="form-control" id="dateToFilter">
                        </div>
                        <div class="col-md-3">
                            <label for="employeeFilter" class="form-label">Employee</label>
                            <select class="form-select" id="employeeFilter">
                                <option value="" selected>All Employees</option>
                                <!-- Employee options will be populated by JavaScript -->
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="benefitTypeFilter" class="form-label">Benefit Type</label>
                            <select class="form-select" id="benefitTypeFilter">
                                <option value="" selected>All Benefit Types</option>
                                <!-- Benefit type options will be populated by JavaScript -->
                            </select>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-3">
                            <label for="minAmountFilter" class="form-label">Min Amount (IDR)</label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="number" class="form-control" id="minAmountFilter" placeholder="0" step="1000">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <label for="maxAmountFilter" class="form-label">Max Amount (IDR)</label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="number" class="form-control" id="maxAmountFilter" placeholder="No limit" step="1000">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <label for="statusFilter" class="form-label">Status</label>
                            <select class="form-select" id="statusFilter">
                                <option value="" selected>All Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <!-- Search Bar -->
                    <div class="row g-3 mb-3">
                        <div class="col-md-12">
                            <label for="searchInput" class="form-label">Search</label>
                            <div class="search-wrapper">
                                <i class="bi bi-search search-icon"></i>
                                <input type="text" class="form-control" id="searchInput"
                                    placeholder="Search by employee name, NIK, or description...">
                            </div>
                        </div>
                    </div>

                    <!-- Quick Filter Buttons -->
                    <div class="quick-filters mb-3">
                        <h6 class="mb-2">Quick Filters:</h6>
                        <button type="button" class="btn btn-outline-primary btn-sm me-2" data-filter="today">
                            Today's Claims
                        </button>
                        <button type="button" class="btn btn-outline-primary btn-sm me-2" data-filter="week">
                            This Week
                        </button>
                        <button type="button" class="btn btn-outline-primary btn-sm me-2" data-filter="month">
                            This Month
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="clearAllFiltersBtn">
                            Clear All Filters
                        </button>
                    </div>

                    <!-- Filter Actions -->
                    <div class="filter-actions">
                        <button type="button" class="btn btn-primary" id="applyFiltersBtn">
                            <i class="bi bi-funnel me-2"></i>Apply Filters
                        </button>
                        <button type="button" class="btn btn-secondary" id="resetFiltersBtn">
                            <i class="bi bi-x-circle me-2"></i>Reset Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Claims Summary Cards -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="summary-cards" id="summaryCards">
                <!-- Summary cards will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Claims Data Table -->
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Claims Data</h5>
                    <div class="table-actions">
                        <button class="btn btn-danger btn-sm" id="exportBtn">
                            <i class="bi bi-file-earmark-arrow-down me-1"></i>Export
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="claims-table">
                            <thead>
                                <tr>
                                    <th data-sort="claim_date">
                                        Claim Date 
                                        <i class="bi bi-arrow-up-down sort-icon"></i>
                                    </th>
                                    <th data-sort="employee_name">
                                        Employee 
                                        <i class="bi bi-arrow-up-down sort-icon"></i>
                                    </th>
                                    <th data-sort="department">
                                        Department 
                                        <i class="bi bi-arrow-up-down sort-icon"></i>
                                    </th>
                                    <th data-sort="benefit_type">
                                        Benefit Type 
                                        <i class="bi bi-arrow-up-down sort-icon"></i>
                                    </th>
                                    <th data-sort="amount">
                                        Claim Amount 
                                        <i class="bi bi-arrow-up-down sort-icon"></i>
                                    </th>
                                    <th data-sort="status">
                                        Status 
                                        <i class="bi bi-arrow-up-down sort-icon"></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="claimsTableBody">
                                <!-- Table data will be populated by JavaScript -->
                            </tbody>
                        </table>

                        <!-- Pagination Controls -->
                        <div class="pagination-controls">
                            <div class="pagination-info">
                                <span id="paginationInfo">Showing 0 of 0 results</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <select class="per-page-select me-3" id="perPageSelect">
                                    <option value="10" selected>10 per page</option>
                                    <option value="25">25 per page</option>
                                    <option value="50">50 per page</option>
                                    <option value="100">100 per page</option>
                                </select>

                                <div class="pagination-buttons">
                                    <button id="prevPageBtn" disabled>
                                        <i class="bi bi-chevron-left"></i> Previous
                                    </button>
                                    <button id="nextPageBtn" disabled>
                                        Next <i class="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Claim Details Modal -->
    <div class="modal fade" id="claimDetailsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-file-text me-2"></i>Claim Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="claim-details-content" id="claimDetailsContent">
                        <!-- Claim details will be populated by JavaScript -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-outline-primary" id="printClaimBtn">
                        <i class="bi bi-printer me-2"></i>Print
                    </button>
                    <button type="button" class="btn btn-primary" id="exportPdfBtn">
                        <i class="bi bi-file-pdf me-2"></i>Export PDF
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Claim Modal -->
    <div class="modal fade" id="editClaimModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-pencil me-2"></i>Edit Claim
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editClaimForm">
                        <div class="edit-claim-content" id="editClaimContent">
                            <!-- Edit form will be populated by JavaScript -->
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveClaimChangesBtn">
                        <i class="bi bi-check-circle me-2"></i>Save Changes
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Export Progress Modal -->
    <div class="modal fade" id="exportProgressModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-download me-2"></i>Exporting Claims Data
                    </h5>
                </div>
                <div class="modal-body text-center">
                    <div class="export-progress">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mb-0">Please wait while we prepare your export...</p>
                        <div class="progress mt-3" style="height: 8px;">
                            <div class="progress-bar" role="progressbar" style="width: 0%" id="exportProgressBar"></div>
                        </div>
                        <small class="text-muted mt-2 d-block" id="exportProgressText">Initializing...</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/employees/styles.css') }}">
    <link rel="stylesheet" href="{{ asset('css/claims-history.css') }}">
    <!-- Animate.css for SweetAlert2 animations -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
@endpush

@push('scripts')
    <!-- Authentication middleware -->
    <script src="{{ asset('js/login/auth-middleware.js') }}"></script>
    
    <!-- SweetAlert2 for notifications -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.all.min.js"></script>
    
    <!-- jQuery (required for enhanced functionality) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- Claims history utilities -->
    <script src="{{ asset('js/claims-history/table-manager.js') }}"></script>
    <script src="{{ asset('js/claims-history/filter-manager.js') }}"></script>
    <script src="{{ asset('js/claims-history/export-manager.js') }}"></script>
    <script src="{{ asset('js/claims-history/modal-manager.js') }}"></script>
    
    <!-- API integration layer -->
    <script src="{{ asset('js/claims-history/claims-history-api.js') }}"></script>
    
    <!-- Main application logic -->
    <script src="{{ asset('js/claims-history/claims-history-main.js') }}"></script>
@endpush 