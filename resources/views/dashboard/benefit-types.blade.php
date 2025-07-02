@extends('layouts.dashboard')

@section('title', 'Benefit Types Management')
@section('page-title', 'Benefit Types Management')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Benefit Types</li>
@endsection

@section('content')
<div class="row mb-4">
    <div class="col-md-8">
        <h1 class="h3">Benefit Types Management</h1>
        <p class="text-muted">Manage benefit types available for employee claims</p>
    </div>
    <div class="col-md-4 text-md-end">
        <button type="button" class="btn btn-primary" id="addBenefitTypeBtn"
        data-bs-toggle="modal" 
        data-bs-target="#benefitTypeModal">
            <i class="bi bi-plus-lg me-1"></i> Add New Benefit Type
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
                    <input type="text" class="form-control border-start-0" id="searchBenefitType" 
                        placeholder="Search by benefit type name">
                </div>
            </div>
            <div class="col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                <div class="d-flex align-items-center">
                    <label for="sortBenefitType" class="me-2">Sort by:</label>
                    <select class="form-select" id="sortBenefitType">
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
            <table class="table table-hover benefit-types-table">
                <thead>
                    <tr>
                        <th>Benefit Type Name</th>
                        <th>Date Created</th>
                        <th>Last Updated</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="benefitTypesTableBody">
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
            <div id="emptyBenefitTypes" class="text-center py-5 d-none">
                <i class="bi bi-clipboard-x fs-1 text-muted"></i>
                <h5 class="mt-3">No benefit types found</h5>
                <p class="text-muted">Try adjusting your search or add a new benefit type</p>
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

<!-- Add Benefit Type Modal -->
<div class="modal fade" id="benefitTypeModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="benefitTypeModalTitle">Add New Benefit Type</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="benefitTypeForm">
                    <input type="hidden" id="benefitTypeId">
                    <div class="mb-3">
                        <label for="benefitTypeName" class="form-label">Benefit Type Name</label>
                        <input type="text" class="form-control" id="benefitTypeName" 
                            placeholder="e.g., Medical, Glasses, Dental" required>
                        <div class="invalid-feedback" id="benefitTypeNameError"></div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveBenefitType">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Save
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Dialog -->
<div class="modal fade" id="deleteBenefitTypeModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Benefit Type</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete <strong id="deleteBenefitTypeName"></strong>? This action cannot be undone.</p>
                <p class="text-muted">This will remove this benefit type from the system but won't affect historical data.</p>
                <input type="hidden" id="deleteBenefitTypeId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBenefitType">
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
<!-- Authentication middleware -->
<script src="{{ asset('js/login/auth-middleware.js') }}"></script>

<!-- Benefit Types JavaScript files -->
<script src="{{ asset('js/benefit-types/benefit-types-api.js') }}"></script>
<script src="{{ asset('js/benefit-types/benefit-types-main.js') }}"></script>
@endpush