@extends('layouts.dashboard')

@section('title', 'Marriage Statuses Management')
@section('page-title', 'Marriage Statuses Management')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Marriage Statuses</li>
@endsection

@section('content')
<div class="row mb-4">
    <div class="col-md-8">
        <h1 class="h3">Marriage Statuses Management</h1>
        <p class="text-muted">Manage marriage statuses for benefit allocation</p>
    </div>
    <div class="col-md-4 text-md-end">
        <button type="button" class="btn btn-primary" id="addStatusBtn"
        data-bs-toggle="modal" 
        data-bs-target="#statusModal">
            <i class="bi bi-plus-lg me-1"></i> Add New Status
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
                    <input type="text" class="form-control border-start-0" id="searchStatus" 
                        placeholder="Search by code or description">
                </div>
            </div>
            <div class="col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                <div class="d-flex align-items-center">
                    <label for="sortStatus" class="me-2">Sort by:</label>
                    <select class="form-select" id="sortStatus">
                        <option value="code_asc">Code (A-Z)</option>
                        <option value="code_desc">Code (Z-A)</option>
                        <option value="description_asc">Description (A-Z)</option>
                        <option value="description_desc">Description (Z-A)</option>
                        <option value="created_desc">Date created (newest)</option>
                        <option value="created_asc">Date created (oldest)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="table-responsive">
            <table class="table table-hover marriage-statuses-table">
                <thead>
                    <tr>
                        <th>Status Code</th>
                        <th>Description</th>
                        <th>Date Created</th>
                        <th>Last Updated</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="marriageStatusesTableBody">
                    <!-- Loading skeleton -->
                    <tr class="loading-skeleton">
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
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                    <tr class="loading-skeleton">
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td><div class="skeleton-line"></div></td>
                        <td class="text-end"><div class="skeleton-line"></div></td>
                    </tr>
                </tbody>
            </table>

            <!-- Empty State -->
            <div id="emptyMarriageStatuses" class="text-center py-5 d-none">
                <i class="bi bi-clipboard-x fs-1 text-muted"></i>
                <h5 class="mt-3">No marriage statuses found</h5>
                <p class="text-muted">Try adjusting your search or add a new marriage status</p>
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

<!-- Add/Edit Status Modal -->
<div class="modal fade" id="statusModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="statusModalTitle">Add New Marriage Status</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="statusForm">
                    <input type="hidden" id="statusId">
                    <div class="mb-3">
                        <label for="statusCode" class="form-label">Status Code</label>
                        <input type="text" class="form-control" id="statusCode" 
                            placeholder="e.g., TK, K0, K1" required maxlength="10">
                        <div class="invalid-feedback" id="statusCodeError"></div>
                    </div>
                    <div class="mb-3">
                        <label for="statusDescription" class="form-label">Description</label>
                        <textarea class="form-control" id="statusDescription" 
                            placeholder="e.g., Tidak Kawin (Single)" rows="3"></textarea>
                        <div class="invalid-feedback" id="statusDescriptionError"></div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveStatus">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Save
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Dialog -->
<div class="modal fade" id="deleteStatusModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Marriage Status</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete <strong id="deleteStatusCode"></strong>? This action cannot be undone.</p>
                <p class="text-muted">This will remove this status from the system but won't affect historical data.</p>
                <input type="hidden" id="deleteStatusId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteStatus">
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
<script src="{{ asset('js/marriage-statuses/marriage-statuses-api.js') }}"></script>
<script src="{{ asset('js/marriage-statuses/marriage-statuses-main.js') }}"></script>
@endpush