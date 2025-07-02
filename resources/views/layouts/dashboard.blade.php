<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Medical Claim') }} - @yield('title', 'Dashboard')</title>
    
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    
    <!-- SweetAlert2 CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.min.css">
    
    <!-- Dashboard custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/dashboard/styles.css') }}">
    
    <style>
        /* Additional styles for responsive sidebar */
        .nav-section {
            padding: 10px 15px 5px;
            font-size: 0.8rem;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 600;
        }
        
        .nav-section-title {
            opacity: 0.8;
        }
        
        /* Improved active state */
        .nav-link.active {
            background-color: rgba(13, 110, 253, 0.1);
            color: #0d6efd;
            font-weight: 500;
            border-radius: 4px;
        }
        
        /* Transition for smooth sidebar toggle */
        .sidebar, .main-content {
            transition: all 0.3s ease;
        }
        
        /* Hover effect for nav items */
        .nav-item .nav-link:hover:not(.active) {
            background-color: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
        }
        
        /* Improved sidebar body for scrolling */
        .sidebar-body {
            overflow-y: auto;
            height: calc(100% - 60px);
        }
        
        /* Responsive sidebar for mobile */
        @media (max-width: 991.98px) {
            .sidebar {
                margin-left: -250px;
            }
            
            .sidebar.expanded {
                margin-left: 0;
            }
            
            .main-content {
                margin-left: 0;
                width: 100%;
            }
        }
    </style>
    
    @stack('styles')
</head>

<body>
    <!-- Header Component -->
    @include('components.dashboard.header')

    <!-- Sidebar Component -->
    @include('components.dashboard.sidebar')

    <!-- Main Content -->
    <div class="main-content" id="mainContent">
        <div class="container-fluid p-4">
            <!-- Page Title (Mobile only) -->
            <div class="d-block d-md-none mb-4">
                <h4 class="mb-0">@yield('page-title', 'Dashboard')</h4>
            </div>
            
            @yield('content')
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.32/dist/sweetalert2.all.min.js"></script>
    <!-- Auth Middleware -->
    <script src="{{ asset('js/login/auth-middleware.js') }}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // Sidebar toggle
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            const sidebarToggler = document.getElementById('sidebarToggler');

            // Check if mobile view was toggled before
            const sidebarState = localStorage.getItem('sidebarExpanded');
            if (sidebarState === 'true' && window.innerWidth > 991.98) {
                sidebar.classList.add('expanded');
                mainContent.classList.add('expanded');
            }

            sidebarToggler.addEventListener('click', function () {
                sidebar.classList.toggle('expanded');
                mainContent.classList.toggle('expanded');
                
                // Save state to localStorage (only for desktop)
                if (window.innerWidth > 991.98) {
                    localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
                }
            });

            // Handle window resize
            window.addEventListener('resize', function() {
                if (window.innerWidth > 991.98) {
                    // Reset sidebar to default expanded state on large screens
                    if (localStorage.getItem('sidebarExpanded') !== 'false') {
                        sidebar.classList.add('expanded');
                        mainContent.classList.add('expanded');
                    }
                } else {
                    // Collapse sidebar on small screens by default
                    sidebar.classList.remove('expanded');
                    mainContent.classList.remove('expanded');
                }
            });

            // Update user name from localStorage
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    if (user && user.name) {
                        document.getElementById('user-name').textContent = user.name;
                        const welcomeNameElement = document.getElementById('welcome-name');
                        if (welcomeNameElement) {
                            welcomeNameElement.textContent = user.name;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing user data', e);
                }
            }

            // Logout functionality
            document.getElementById('logout-button').addEventListener('click', function (e) {
                e.preventDefault();
                if (window.Auth && typeof window.Auth.logout === 'function') {
                    window.Auth.logout();
                } else {
                    // Fallback if Auth is not available
                    localStorage.clear();
                    window.location.href = '/login-form';
                }
            });
        });
    </script>

    @stack('scripts')
</body>

</html>