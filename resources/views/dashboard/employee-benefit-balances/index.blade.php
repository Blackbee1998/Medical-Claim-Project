@extends('layouts.dashboard')

@section('title', 'Employee Benefit Balances')
@section('page-title', 'Employee Benefit Balances')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Benefit Balances</li>
@endsection

@section('content')
    <!-- Header Section -->
    <div class="row">
        <div class="col-12">
            <div class="card welcome-card mb-4">
                <div
                    class="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <div>
                        <h2>Employee Benefit Balances</h2>
                        <p class="mb-0">View and manage benefit balances for all employees</p>
                    </div>
                    <div class="mt-3 mt-md-0 d-flex">
                        <button class="initialize-balances-btn">
                            <i class="bi bi-plus-circle me-2"></i>Initialize Balances
                        </button>
                        <button class="export-data-btn">
                            <i class="bi bi-download me-2"></i>Export Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Filter Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card stats-card primary">
                <div class="card-body">
                    <h5 class="mb-3">Filter Benefit Balances</h5>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <select class="form-select" id="employeeFilter">
                                <option value="" selected>All Employees</option>
                                <!-- Employee options will be populated by JavaScript -->
                            </select>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="benefitTypeFilter">
                                <option value="" selected>All Benefit Types</option>
                                <!-- Benefit type options will be populated by JavaScript -->
                            </select>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="yearFilter">
                                <!-- Year options will be populated by JavaScript -->
                            </select>
                        </div>
                    </div>

                    <div class="row g-3 mt-1">
                        <div class="col-md-12">
                            <div class="search-wrapper">
                                <i class="bi bi-search search-icon"></i>
                                <input type="text" class="form-control" id="searchInput"
                                    placeholder="Search by employee name, NIK, or department">
                            </div>
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-3">
                        <button type="button" class="btn btn-primary" id="applyFiltersBtn">
                            <i class="bi bi-funnel me-2"></i>Apply Filters
                        </button>
                        <button type="button" class="btn btn-secondary" id="clearFiltersBtn">
                            <i class="bi bi-x-circle me-2"></i>Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Summary Statistics Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="summary-cards">
                <!-- Summary cards will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Data Table Section -->
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="balance-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Benefit Type</th>
                                    <th>Year</th>
                                    <th>Initial Balance</th>
                                    <th>Current Balance</th>
                                    <th>Usage</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Table data will be populated by JavaScript -->
                            </tbody>
                        </table>

                        <div class="pagination-controls">
                            <div class="pagination-info">
                                Showing page 1 of 10
                            </div>
                            <div class="d-flex align-items-center">
                                <select class="per-page-select me-3">
                                    <option value="10" selected>10 per page</option>
                                    <option value="25">25 per page</option>
                                    <option value="50">50 per page</option>
                                    <option value="100">100 per page</option>
                                </select>

                                <div class="pagination-buttons">
                                    <button disabled><i class="bi bi-chevron-left"></i> Previous</button>
                                    <button>Next <i class="bi bi-chevron-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Initialize Balances Modal -->
    <div class="modal fade" id="initializeBalancesModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Initialize Benefit Balances</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted mb-4">Initialize or reset benefit balances for employees based on predefined budget allocations.</p>
                    
                    <form id="initializeBalancesForm">
                        <div class="mb-3">
                            <label for="budgetYear" class="form-label">Budget Year</label>
                            <select class="form-select" id="budgetYear" required>
                                <!-- Year options will be populated by JavaScript -->
                            </select>
                            <div class="invalid-feedback">Please select a budget year</div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Employee Selection</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="employeeSelection" id="allEmployees" value="all" checked>
                                <label class="form-check-label" for="allEmployees">
                                    All Employees
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="employeeSelection" id="selectedEmployees" value="selected">
                                <label class="form-check-label" for="selectedEmployees">
                                    Selected Employees
                                </label>
                            </div>
                        </div>
                        
                        <div class="mb-3 employee-select-container d-none">
                            <label for="employeeSelect" class="form-label">Select Employees</label>
                            <select class="form-select" id="employeeSelect" multiple disabled>
                                <!-- Employee options will be populated by JavaScript -->
                            </select>
                            <div class="d-flex justify-content-end mt-1">
                                <button type="button" class="btn btn-sm btn-link" id="selectAllEmployees">Select All</button>
                                <button type="button" class="btn btn-sm btn-link ms-2" id="clearEmployeeSelection">Clear</button>
                            </div>
                            <div class="invalid-feedback">Please select at least one employee</div>
                        </div>
                        
                        <div class="alert alert-warning">
                            <small>
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                This will set or reset balances to initial budget values. Existing balances will be overwritten.
                            </small>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="confirmInitialization" required>
                                <label class="form-check-label" for="confirmInitialization">
                                    I understand this will set/reset balances to initial budget values
                                </label>
                                <div class="invalid-feedback">You must confirm this action</div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmInitializeBalances">
                        <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                        Initialize Balances
                    </button>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/employees/styles.css') }}">
    <link rel="stylesheet" href="{{ asset('css/benefit-balances.css') }}">
    
    <!-- Custom styles for employee selection -->
    <style>
        /* Custom Select2 styling for employee selection */
        .employee-select-result {
            padding: 5px 0;
        }
        
        .employee-name {
            font-weight: 500;
            color: #212529;
        }
        
        .employee-details {
            font-size: 0.875rem;
            color: #6c757d !important;
            margin-top: 2px;
        }
        
        /* Select2 container styling */
        .select2-container--default .select2-selection--multiple {
            min-height: 38px;
            border: 1px solid #ced4da;
            border-radius: 0.375rem;
        }
        
        .select2-container--default .select2-selection--multiple .select2-selection__choice {
            background-color: #0d6efd;
            border: 1px solid #0d6efd;
            color: white;
            border-radius: 0.25rem;
            padding: 2px 8px;
            margin: 2px;
        }
        
        .select2-container--default .select2-selection--multiple .select2-selection__choice__remove {
            color: white;
            margin-right: 5px;
        }
        
        .select2-container--default .select2-selection--multiple .select2-selection__choice__remove:hover {
            color: #dc3545;
        }
        
        /* Dropdown styling */
        .select2-dropdown {
            border: 1px solid #ced4da;
            border-radius: 0.375rem;
        }
        
        .select2-container--default .select2-results__option--highlighted[aria-selected] {
            background-color: #0d6efd;
        }
        
        /* Loading state */
        .select2-container--default .select2-selection--multiple .select2-selection__placeholder {
            color: #6c757d;
        }
        
        /* Empty State Styles */
        .empty-state {
            padding: 2rem 1rem;
        }
        
        .empty-state h5 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .empty-state p {
            font-size: 0.95rem;
            line-height: 1.5;
            max-width: 500px;
            margin: 0 auto;
        }
        
        .filtered-empty-state {
            padding: 1.5rem 1rem;
        }
        
        .filtered-empty-state h6 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .filtered-empty-state p {
            font-size: 0.9rem;
            line-height: 1.4;
        }
    </style>
@endpush

@push('scripts')
    <!-- Authentication middleware -->
    <script src="{{ asset('js/login/auth-middleware.js') }}"></script>
    
    <!-- SweetAlert2 for notifications -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.all.min.js"></script>
    
    <!-- jQuery (required for Select2) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- Select2 CSS and JS for enhanced select dropdowns -->
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    
    <!-- CSV export utilities -->
    <script src="{{ asset('js/benefit-balances/csv-export.js') }}"></script>
    
    <!-- Balance visualization utilities -->
    <script src="{{ asset('js/benefit-balances/balance-visualization.js') }}"></script>
    
    <!-- API integration layer -->
    <script src="{{ asset('js/benefit-balances/benefit-balances-api.js') }}"></script>
    
    <!-- Main application logic -->
    <script src="{{ asset('js/benefit-balances/benefit-balances-main.js') }}"></script>
@endpush 