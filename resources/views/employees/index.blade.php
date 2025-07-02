@extends('layouts.dashboard')

@section('title', 'Employees Management')
@section('page-title', 'Employees Management')

@section('breadcrumbs')
<li class="breadcrumb-item active">Employees</li>
@endsection

@section('content')
<!-- Header Section -->
<div class="row">
    <div class="col-12">
        <div class="card welcome-card mb-4">
            <div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                <div>
                    <h2>Employees Management</h2>
                    <p class="mb-0">Manage employee information and details</p>
                </div>
                <div class="mt-3 mt-md-0">
                    <button class="add-employee-btn">
                        <i class="bi bi-plus-circle me-2"></i>Add New Employee
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
                <h5 class="mb-3">Filter Employees</h5>
                <div class="row g-3">
                    <div class="col-md-3">
                        <select class="form-select" id="departmentFilter">
                            <option value="" selected>All Departments</option>
                            <!-- Departments will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="levelFilter">
                            <option value="" selected>All Levels</option>
                            <!-- Level options will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="marriageFilter">
                            <option value="" selected>All Marriage Status</option>
                            <!-- Marriage status options will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="genderFilter">
                            <option value="" selected>All Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>

                <div class="row g-3 mt-1">
                    <div class="col-md-8">
                        <div class="search-wrapper">
                            <i class="bi bi-search search-icon"></i>
                            <input type="text" class="form-control" id="searchInput"
                                placeholder="Search by name, NIK, or department">
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

<!-- Data Table Section -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="employee-table">
                        <thead>
                            <tr>
                                <th>NIK</th>
                                <th>Employee Name</th>
                                <th>Department</th>
                                <th>Level</th>
                                <th>Marriage Status</th>
                                <th>Gender</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Sample data - will be replaced with actual data -->
                            <tr>
                                <td>EMP001</td>
                                <td>John Doe</td>
                                <td>IT</td>
                                <td>Senior</td>
                                <td>Married</td>
                                <td>Male</td>
                                <td>
                                    <div class="action-buttons">
                                        <a href="#" class="action-icon view-icon" data-bs-toggle="tooltip"
                                            title="View Details">
                                            <i class="bi bi-eye"></i>
                                        </a>
                                        <a href="#" class="action-icon edit-icon" data-bs-toggle="tooltip"
                                            title="Edit Employee">
                                            <i class="bi bi-pencil-square"></i>
                                        </a>
                                        <a href="#" class="action-icon delete-icon" data-bs-toggle="tooltip"
                                            title="Delete Employee">
                                            <i class="bi bi-trash"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="pagination-wrapper">
                    <div class="pagination-info">
                        Showing page 1 of 10
                    </div>
                    <div class="pagination-controls">
                        <select class="form-select me-3 per-page-select">
                            <option value="10">10 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                        <div class="btn-group pagination-buttons">
                            <button type="button" class="btn btn-outline-primary" id="prevPage">
                                <i class="bi bi-chevron-left"></i> Previous
                            </button>
                            <button type="button" class="btn btn-outline-primary" id="nextPage">
                                <i class="bi bi-chevron-right"></i> Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modals (Add/Edit Employee) -->
<div class="modal fade" id="employeeModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header border-0 pb-0">
                <div>
                    <h5 class="modal-title fw-bold" id="employeeModalTitle">Add New Employee</h5>
                    <p class="modal-subtitle text-muted small mt-1"></p>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body pt-2">
                <form id="employeeForm" class="needs-validation" novalidate>
                    <input type="hidden" id="employeeId">

                    <!-- Form Row 1: NIK and Full Name -->
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <div class="form-floating">
                                <input type="text" class="form-control" id="nik" placeholder="Enter NIK" required>
                                <label for="nik">NIK</label>
                                <div class="invalid-feedback">Please enter a valid NIK</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating">
                                <input type="text" class="form-control" id="name" placeholder="Enter full name"
                                    required>
                                <label for="name">Full Name</label>
                                <div class="invalid-feedback">Please enter employee name</div>
                            </div>
                        </div>
                    </div>

                    <!-- Form Row 2: Department and Gender -->
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <div class="form-floating">
                                <select class="form-select" id="department" required>
                                    <option value="" selected disabled>Select Department</option>
                                    <!-- Departments will be loaded dynamically -->
                                </select>
                                <label for="department">Department</label>
                                <div class="invalid-feedback">Please select a department</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating">
                                <select class="form-select" id="gender" required>
                                    <option value="" selected disabled>Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                <label for="gender">Gender</label>
                                <div class="invalid-feedback">Please select gender</div>
                            </div>
                        </div>
                    </div>

                    <!-- Form Row 3: Employee Level and Marriage Status -->
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-floating">
                                <select class="form-select" id="level" required>
                                    <option value="" selected disabled>Select Level</option>
                                    <!-- Levels will be loaded dynamically -->
                                </select>
                                <label for="level">Employee Level</label>
                                <div class="invalid-feedback">Please select employee level</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating">
                                <select class="form-select" id="marriageStatus" required>
                                    <option value="" selected disabled>Select Marriage Status</option>
                                    <!-- Marriage statuses will be loaded dynamically -->
                                </select>
                                <label for="marriageStatus">Marriage Status</label>
                                <div class="invalid-feedback">Please select marriage status</div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer border-0 pt-0">
                <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary rounded-pill px-4" id="saveEmployee">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Save Employee
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Employee</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete employee <strong id="deleteEmployeeName"></strong>?</p>
                <p class="text-muted">This action cannot be undone, but historical data will be preserved.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDelete">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Delete
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link rel="stylesheet" href="{{ asset('css/employees/styles.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/employees/employees-api.js') }}"></script>
<script src="{{ asset('js/employees/employees-filters.js') }}"></script>
<script src="{{ asset('js/employees/employees.js') }}"></script>
@endpush