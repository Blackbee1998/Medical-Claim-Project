@extends('layouts.dashboard')

@section('title', 'Benefit Budgets Management')
@section('page-title', 'Benefit Budgets Management')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Benefit Budgets</li>
@endsection

@section('content')
<div class="row mb-4">
    <div class="col-md-8">
        <h1 class="h3">Benefit Budgets Management</h1>
        <p class="text-muted">Manage budget allocations for different benefit types based on employee level and marriage status</p>
    </div>
    <div class="col-md-4 text-md-end">
        <button type="button" class="btn btn-primary" id="addBudgetBtn"
        data-bs-toggle="modal" 
        data-bs-target="#budgetModal">
            <i class="bi bi-plus-lg me-1"></i> Add New Budget
        </button>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <!-- Filter and Search Section -->
        <div class="filter-panel mb-4">
            <div class="row g-3">
                <div class="col-md-3 col-sm-6">
                    <label for="filterBenefitType" class="form-label">Benefit Type</label>
                    <select class="form-select" id="filterBenefitType">
                        <option value="">All</option>
                    </select>
                </div>
                <div class="col-md-3 col-sm-6">
                    <label for="filterEmployeeLevel" class="form-label">Employee Level</label>
                    <select class="form-select" id="filterEmployeeLevel">
                        <option value="">All</option>
                    </select>
                </div>
                <div class="col-md-3 col-sm-6">
                    <label for="filterMarriageStatus" class="form-label">Marriage Status</label>
                    <select class="form-select" id="filterMarriageStatus">
                        <option value="">All</option>
                    </select>
                </div>
                <div class="col-md-3 col-sm-6">
                    <label for="filterYear" class="form-label">Budget Year</label>
                    <select class="form-select" id="filterYear">
                        <option value="">All</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label for="searchBudget" class="form-label">Search</label>
                    <input type="text" class="form-control" id="searchBudget" placeholder="Search by benefit type, employee level, marriage status, year, or budget amount...">
                </div>
                <div class="col-md-6 d-flex align-items-end justify-content-end">
                    <button type="button" class="btn btn-outline-secondary" id="clearFiltersBtn">
                        <i class="bi bi-x-circle me-1"></i> Clear All Filters
                    </button>
                    <div class="ms-3" id="filterLoadingIndicator" style="display: none;">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Filtering...</span>
                        </div>
                        <small class="text-muted ms-2">Filtering...</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="table-responsive">
            <table class="table table-hover benefit-budgets-table">
                <thead>
                    <tr>
                        <th>Benefit Type</th>
                        <th>Employee Level</th>
                        <th>Marriage Status</th>
                        <th>Year</th>
                        <th>Budget Amount</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="benefitBudgetsTableBody">
                    <!-- Loading skeleton -->
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                </tbody>
            </table>

            <!-- Empty State -->
            <div id="emptyBenefitBudgets" class="text-center py-5 d-none">
                <i class="bi bi-clipboard-x fs-1 text-muted"></i>
                <h5 class="mt-3">No benefit budgets found matching your criteria</h5>
                <p class="text-muted">Try adjusting your search or filters, or add a new budget allocation</p>
            </div>
        </div>

        <!-- Pagination Section -->
        <div class="row mt-4" id="paginationSection">
            <div class="col-md-6">
                <p class="mb-0" id="paginationInfo">Showing page 1 of 1</p>
            </div>
            <div class="col-md-6">
                <div class="d-flex justify-content-md-end">
                    <div class="d-flex align-items-center">
                        <select class="form-select me-3" id="itemsPerPage">
                            <option value="10">10 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-secondary" id="prevPageBtn" disabled>
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="nextPageBtn" disabled>
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

<!-- Add/Edit Budget Modal -->
<div class="modal fade" id="budgetModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="budgetModalTitle">Add New Budget Allocation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="budgetForm">
                    <input type="hidden" id="budgetId">
                    <div class="mb-3">
                        <label for="benefitTypeId" class="form-label">Benefit Type</label>
                        <select class="form-select" id="benefitTypeId" required>
                            <option value="">Select Benefit Type</option>
                        </select>
                        <div class="invalid-feedback" id="benefitTypeIdError"></div>
                    </div>
                    <div class="mb-3">
                        <label for="employeeLevelId" class="form-label">Employee Level</label>
                        <select class="form-select" id="employeeLevelId" required>
                            <option value="">Select Employee Level</option>
                        </select>
                        <div class="invalid-feedback" id="employeeLevelIdError"></div>
                    </div>
                    <div class="mb-3">
                        <label for="marriageStatusId" class="form-label">Marriage Status</label>
                        <select class="form-select" id="marriageStatusId" required>
                            <option value="">Select Marriage Status</option>
                        </select>
                        <div class="invalid-feedback" id="marriageStatusIdError"></div>
                    </div>
                    <div class="mb-3">
                        <label for="budgetYear" class="form-label">Budget Year</label>
                        <input type="number" class="form-control" id="budgetYear" min="2020" max="2030" required>
                        <div class="invalid-feedback" id="budgetYearError"></div>
                    </div>
                    <div class="mb-3">
                        <label for="budgetAmount" class="form-label">Budget Amount</label>
                        <div class="input-group">
                            <span class="input-group-text">IDR</span>
                            <input type="text" class="form-control" id="budgetAmount" required>
                        </div>
                        <div class="form-text">Enter amount in IDR</div>
                        <div class="invalid-feedback" id="budgetAmountError"></div>
                    </div>
                    <div class="alert alert-info">
                        <small>Each combination of Benefit Type, Employee Level, Marriage Status, and Year must be unique</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveBudget">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Save
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Budget Confirmation Dialog -->
<div class="modal fade" id="deleteBudgetModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Budget Allocation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this budget allocation? This action cannot be undone.</p>
                <div class="card bg-light mt-3 mb-3">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Benefit Type:</strong></p>
                                <p id="deleteBenefitType"></p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Employee Level:</strong></p>
                                <p id="deleteEmployeeLevel"></p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Marriage Status:</strong></p>
                                <p id="deleteMarriageStatus"></p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Year:</strong></p>
                                <p id="deleteYear"></p>
                            </div>
                            <div class="col-12">
                                <p class="mb-1"><strong>Budget Amount:</strong></p>
                                <p id="deleteAmount"></p>
                            </div>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="deleteBudgetId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBudget">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Delete
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link rel="stylesheet" href="{{ asset('css/dashboard/benefit-management.css') }}">
@endpush

@push('scripts')
<!-- Authentication middleware for API calls -->
<script src="{{ asset('js/login/auth-middleware.js') }}"></script>

<!-- SweetAlert2 for notifications -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Benefit Budgets JavaScript modules -->
<script src="{{ asset('js/benefit-budgets/benefit-budgets-api.js') }}"></script>
<script src="{{ asset('js/benefit-budgets/benefit-budgets-main.js') }}"></script>
@endpush