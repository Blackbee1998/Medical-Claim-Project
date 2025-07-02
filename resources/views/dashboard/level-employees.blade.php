@extends('layouts.dashboard')

@section('title', 'Employee Levels Management')
@section('page-title', 'Employee Levels Management')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Employee Levels</li>
@endsection

@section('content')
<div class="row mb-4">
    <div class="col-md-8">
        <h1 class="h3">Employee Levels Management</h1>
        <p class="text-muted">Manage employee levels for benefit allocation</p>
    </div>
    <div class="col-md-4 text-md-end">
        <button type="button" class="btn btn-primary" id="addLevelBtn"
        data-bs-toggle="modal" 
        data-bs-target="#levelModal">
            <i class="bi bi-plus-lg me-1"></i> Add New Level
        </button>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <!-- Search and Filter Section -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                        <i class="bi bi-search"></i>
                    </span>
                    <input type="text" class="form-control border-start-0" id="searchLevel" 
                        placeholder="Search by level name">
                </div>
            </div>
            <div class="col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                <div class="d-flex align-items-center">
                    <label for="sortLevel" class="me-2">Sort by:</label>
                    <select class="form-select" id="sortLevel">
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                        <option value="created_desc">Date created (newest)</option>
                        <option value="created_asc">Date created (oldest)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="table-responsive">
            <table class="table table-hover level-employees-table">
                <thead>
                    <tr>
                        <th>Level Name</th>
                        <th>Date Created</th>
                        <th>Last Updated</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="levelEmployeesTableBody">
                    <!-- Loading skeleton -->
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                </tbody>
            </table>

            <!-- Empty State -->
            <div id="emptyLevelEmployees" class="text-center py-5 d-none">
                <i class="bi bi-clipboard-x fs-1 text-muted"></i>
                <h5 class="mt-3">No employee levels found</h5>
                <p class="text-muted">Try adjusting your search or add a new employee level</p>
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
    </div>
</div>

<!-- Add/Edit Level Modal -->
<div class="modal fade" id="levelModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="levelModalTitle">Add New Employee Level</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="levelForm">
                    <input type="hidden" id="levelId">
                    <div class="mb-3">
                        <label for="levelName" class="form-label">Level Name</label>
                        <input type="text" class="form-control" id="levelName" 
                            placeholder="e.g., Staff, Supervisor, Manager" required>
                        <div class="invalid-feedback" id="levelNameError"></div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveLevel">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Save
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Dialog -->
<div class="modal fade" id="deleteLevelModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Employee Level</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete <strong id="deleteLevelName"></strong>? This action cannot be undone.</p>
                <p class="text-muted">This will remove this level from the system but won't affect historical data.</p>
                <input type="hidden" id="deleteLevelId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteLevel">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Delete
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link rel="stylesheet" href="{{ asset('css/dashboard/employee-management.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/level-employees/level-employees-api.js') }}"></script>
<script src="{{ asset('js/level-employees/level-employees-main.js') }}"></script>
@endpush