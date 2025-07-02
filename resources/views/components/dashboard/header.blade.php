<!-- Dashboard Header -->
<nav class="navbar navbar-expand-lg navbar-light fixed-top">
    <div class="container-fluid">
        <!-- Mobile Menu Toggle -->
        <button class="navbar-toggler border-0 p-0 me-2" type="button" id="sidebarToggler">
            <i class="bi bi-list"></i>
        </button>
        
        <!-- Brand Logo -->
        <a class="navbar-brand" href="/">Medical Claim</a>
        
        <!-- Page Title (Visible on larger screens) -->
        <div class="page-title d-none d-md-block">
            <h5 class="mb-0">@yield('page-title', 'Dashboard')</h5>
        </div>
        
        <!-- Breadcrumbs (Optional) -->
        <nav aria-label="breadcrumb" class="d-none d-lg-block ms-3">
            <ol class="breadcrumb mb-0 py-1">
                <li class="breadcrumb-item"><a href="/">Home</a></li>
                @yield('breadcrumbs')
            </ol>
        </nav>
        
        <!-- User Profile & Logout -->
        <div class="ms-auto d-flex align-items-center">
            <div class="dropdown">
                <button class="btn btn-link text-dark dropdown-toggle d-flex align-items-center" 
                        type="button" id="userDropdown" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false">
                    <div class="user-avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <span class="d-none d-sm-inline ms-2" id="user-name">User</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Profile</a></li>
                    <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i>Settings</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item" href="#" id="logout-button">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</nav> 