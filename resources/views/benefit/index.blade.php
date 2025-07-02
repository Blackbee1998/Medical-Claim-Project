@extends('layouts.dashboard')

@section('title', 'Benefits Management')
@section('page-title', 'Benefits Management')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Benefits</li>
@endsection

@section('content')
    <div class="row">
        <div class="col-12">
            <div class="card welcome-card mb-4">
                <div class="card-body">
                    <h2>Employee Benefit Balances</h2>
                    <p class="mb-0">Here's what's happening with your employee benefits today.</p>
                    <div class="d-flex align-items-center justify-content-md-end">
                        <div>
                            <button><i class="bi bi-plus-circle me-2"></i>Export Data</button>
                            <button><i class="bi bi-plus-circle me-2"></i>Initialize Balances</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card primary">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-people-fill"></i>
                    </div>
                    <h3>247</h3>
                    <p class="mb-0">Total Employees with Balances</p>
                    <small class="text-success"><i class="bi bi-arrow-up"></i> 3.2% from previous period</small>
                </div>
            </div>
        </div>
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card success">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <h3>$1,235,400</h3>
                    <p class="mb-0">Total Allocated Budget</p>
                    <small class="text-success"><i class="bi bi-arrow-up"></i> 5.7% from previous period</small>
                </div>
            </div>
        </div>
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card warning">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-wallet2"></i>
                    </div>
                    <h3>$876,250</h3>
                    <p class="mb-0">Total Remaining Balance</p>
                    <small class="text-danger"><i class="bi bi-arrow-down"></i> 2.1% from previous
                        period</small>
                </div>
            </div>
        </div>
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card info">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-pie-chart-fill"></i>
                    </div>
                    <h3>29.1%</h3>
                    <p class="mb-0">Average Usage %</p>
                    <small class="text-success"><i class="bi bi-arrow-up"></i> 1.8% from previous period</small>
                </div>
            </div>
        </div>
    </div>

    <div>
        <div class="card stats-card primary gap-2 p-4">
            <div class="d-flex gap-3 p-1">
                <select class="form-select" id="floatingSelect" aria-label="Floating label select example">
                    <option selected>All Employees</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select>
                <select class="form-select" id="floatingSelect" aria-label="Floating label select example">
                    <option selected>All Benefits</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select>
                <select class="form-select" id="floatingSelect" aria-label="Floating label select example">
                    <option selected>Current Year</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select>
                <input class="form-control w-auto" list="datalistOptions" id="exampleDataList"
                    placeholder="Search by employee name, NIK, or departement">
                <datalist id="datalistOptions">
                    <option value="Employee name">
                    <option value="NIK">
                    <option value="Departement">
                </datalist>
            </div>
        </div>
        <div class="d-flex gap-2 p-1 justify-content-end">
            <button type="button" class="btn btn-primary">Apply Filters</button>
            <button type="button" class="btn btn-secondary">Clear Filters</button>
        </div>
    </div>
    <div class="container">
        <table class="employee-table mt-4">
            <thead>
                <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Benefit Type</th>
                    <th>Year</th>
                    <th>Initial Balance</th>
                    <th>Current Balance</th>
                    <th>Usage</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>John Doe</td>
                    <td>IT Departement</td>
                    <td>Health Insurance</td>
                    <td>2023</td>
                    <td>$10,000</td>
                    <td>$7,500</td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 25%"
                                aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
                        </div>
                    </td>
                    <td>2023-10-01</td>
                    <td>
                        <div class="action-buttons">
                            <a href="#" class="action-icon view-icon" data-bs-toggle="tooltip" title="View Details">
                                <i class="bi bi-eye"></i>
                            </a>
                            <a href="#" class="action-icon edit-icon" data-bs-toggle="tooltip" title="Edit Balance">
                                <i class="bi bi-pencil-square"></i>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Jane Smith</td>
                    <td>HR Departement</td>
                    <td>Dental</td>
                    <td>2023</td>
                    <td>$5,000</td>
                    <td>$2,000</td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar bg-warning" role="progressbar" style="width: 60%"
                                aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">60%</div>
                        </div>
                    </td>
                    <td>2023-10-05</td>
                    <td>
                        <div class="action-buttons">
                            <a href="#" class="action-icon view-icon" data-bs-toggle="tooltip" title="View Details">
                                <i class="bi bi-eye"></i>
                            </a>
                            <a href="#" class="action-icon edit-icon" data-bs-toggle="tooltip" title="Edit Balance">
                                <i class="bi bi-pencil-square"></i>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>Mike Johnson</td>
                    <td>Finance Departement</td>
                    <td>Vision</td>
                    <td>2023</td>
                    <td>$3,000</td>
                    <td>$500</td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar bg-danger" role="progressbar" style="width: 83%"
                                aria-valuenow="83" aria-valuemin="0" aria-valuemax="100">83%</div>
                        </div>
                    </td>
                    <td>2023-10-10</td>
                    <td>
                        <div class="action-buttons">
                            <a href="#" class="action-icon view-icon" data-bs-toggle="tooltip" title="View Details">
                                <i class="bi bi-eye"></i>
                            </a>
                            <a href="#" class="action-icon edit-icon" data-bs-toggle="tooltip" title="Edit Balance">
                                <i class="bi bi-pencil-square"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
@endsection

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/benefit/styles.css') }}">
@endpush