@extends('layouts.dashboard')

@section('title', 'Dashboard')
@section('page-title', 'Dashboard Overview')

@section('breadcrumbs')
    <li class="breadcrumb-item active">Dashboard</li>
@endsection

@section('content')
    <div class="row">
        <div class="col-12">
            <div class="card welcome-card mb-4">
                <div class="card-body">
                    <h2>Welcome, <span id="welcome-name">User</span>!</h2>
                    <p class="mb-0">Here's what's happening with your employee benefits today.</p>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card primary">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-people"></i>
                    </div>
                    <h3>149</h3>
                    <p class="mb-0">Total Employees</p>
                </div>
            </div>
        </div>
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card success">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <h3>17</h3>
                    <p class="mb-0">Benefit Types</p>
                </div>
            </div>
        </div>
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card warning">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-calendar2-check"></i>
                    </div>
                    <h3>24</h3>
                    <p class="mb-0">Pending Approvals</p>
                </div>
            </div>
        </div>
        <div class="col-md-6 col-lg-3">
            <div class="card stats-card info">
                <div class="card-body">
                    <div class="icon">
                        <i class="bi bi-file-earmark-text"></i>
                    </div>
                    <h3>87</h3>
                    <p class="mb-0">Reports Generated</p>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Recent Activity</h5>
                    <button class="btn btn-sm btn-outline-primary">View All</button>
                </div>
                <div class="card-body p-0">
                    <div class="list-group list-group-flush">
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">New employee benefit added</h6>
                                <small>3 days ago</small>
                            </div>
                            <p class="mb-1">John Doe received a new health insurance benefit.</p>
                        </div>
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">Benefit claim approved</h6>
                                <small>1 week ago</small>
                            </div>
                            <p class="mb-1">Jane Smith's education allowance claim was approved.</p>
                        </div>
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">Employee level updated</h6>
                                <small>2 weeks ago</small>
                            </div>
                            <p class="mb-1">Michael Johnson was promoted to Senior Manager.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Quick Actions</h5>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary">
                            <i class="bi bi-plus-circle me-2"></i>Add New Employee
                        </button>
                        <button class="btn btn-outline-primary">
                            <i class="bi bi-list-check me-2"></i>Manage Benefits
                        </button>
                        <button class="btn btn-outline-primary">
                            <i class="bi bi-file-earmark-text me-2"></i>Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection