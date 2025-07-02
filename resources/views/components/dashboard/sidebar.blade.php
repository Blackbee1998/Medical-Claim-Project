<!-- Dashboard Sidebar Navigation -->
<div class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <h5 class="mb-0">Medical Claim</h5>
    </div>
    
    <div class="sidebar-body">
        <ul class="nav flex-column">
            <!-- Dashboard Home -->
            <li class="nav-item">
                <a class="nav-link {{ request()->is('/') ? 'active' : '' }}" href="/">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            
            <!-- Employee Management Section -->
            <li class="nav-section">
                <span class="nav-section-title">Employee Management</span>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/employees*') ? 'active' : '' }}" 
                   href="/dashboard/employees">
                    <i class="bi bi-people"></i>
                    <span>Employees</span>
                </a>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/employee-benefit-balances*') ? 'active' : '' }}" 
                   href="/dashboard/employee-benefit-balances">
                    <i class="bi bi-wallet2"></i>
                    <span>Benefit Balances</span>
                </a>
            </li>
            
            <!-- Master Data Section -->
            <li class="nav-section">
                <span class="nav-section-title">Master Data</span>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('level-employees*') ? 'active' : '' }}" 
                   href="/level-employees">
                    <i class="bi bi-diagram-3"></i>
                    <span>Employee Levels</span>
                </a>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('marriage-statuses*') ? 'active' : '' }}" 
                   href="/marriage-statuses">
                    <i class="bi bi-heart"></i>
                    <span>Marriage Statuses</span>
                </a>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/benefit-types*') ? 'active' : '' }}" 
                   href="/dashboard/benefit-types">
                    <i class="bi bi-bandaid"></i>
                    <span>Benefit Types</span>
                </a>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/benefit-budgets*') ? 'active' : '' }}" 
                   href="/dashboard/benefit-budgets">
                    <i class="bi bi-cash-stack"></i>
                    <span>Benefit Budgets</span>
                </a>
            </li>
            
            <!-- Claims Management Section -->
            <li class="nav-section">
                <span class="nav-section-title">Claims Management</span>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/claims-processing*') ? 'active' : '' }}" 
                   href="/dashboard/claims-processing">
                    <i class="bi bi-clipboard-check"></i>
                    <span>Process Claims</span>
                </a>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/claims-history*') ? 'active' : '' }}" 
                   href="/dashboard/claims-history">
                    <i class="bi bi-clock-history"></i>
                    <span>Claims History</span>
                </a>
            </li>
            
            <!-- Benefits Section -->
            <li class="nav-section">
                <span class="nav-section-title">Benefits</span>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('dashboard/benefit*') ? 'active' : '' }}" 
                   href="/dashboard/benefit">
                    <i class="bi bi-gift"></i>
                    <span>Benefits</span>
                </a>
            </li>
            
            <!-- Account Section (Optional) -->
            @if(false) <!-- Remove this condition if account section is needed -->
            <li class="nav-section">
                <span class="nav-section-title">Account</span>
            </li>
            
            <li class="nav-item">
                <a class="nav-link {{ request()->is('account/activity*') ? 'active' : '' }}" 
                   href="{{ route('account.activity') }}">
                    <i class="bi bi-activity"></i>
                    <span>Activity</span>
                </a>
            </li>
            @endif
        </ul>
    </div>
</div> 