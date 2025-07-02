<?php

use App\Models\BenefitTypes;
use Illuminate\Http\Request;
use App\Models\PasswordReset;
use App\Middleware\JwtMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\BenefitTypesController;
use App\Http\Controllers\BenefitBudgetController;
use App\Http\Controllers\LevelEmployeeController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\MarriageStatusController;
use App\Http\Controllers\BenefitClaimController;
use App\Http\Controllers\EmployeeBenefitBalanceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes that need CSRF protection (for browser-based forms)
Route::middleware(['web'])->group(function () {
    Route::post('v1/auth/register', [AuthController::class, 'register']);
    Route::post('v1/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('v1/auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('v1/auth/reset-password', [PasswordResetController::class, 'resetPassword']);
});

Route::middleware('jwt')->group(function () {

    Route::post('/v1/level-employees', [LevelEmployeeController::class, 'store']);
    Route::patch('/v1/level-employees/{id}', [LevelEmployeeController::class, 'update']);
    Route::delete('/v1/level-employees/{id}', [LevelEmployeeController::class, 'destroy']);

    Route::post('/v1/marriage-statuses', [MarriageStatusController::class, 'store']);
    Route::patch('/v1/marriage-statuses/{id}', [MarriageStatusController::class, 'update']);
    Route::delete('/v1/marriage-statuses/{id}', [MarriageStatusController::class, 'destroy']);

    Route::post('/v1/employees', [EmployeeController::class, 'store']);
    Route::patch('/v1/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/v1/employees/{id}', [EmployeeController::class, 'destroy']);

    Route::post('/v1/benefit-types', [BenefitTypesController::class, 'store']);
    Route::patch('/v1/benefit-types/{id}', [BenefitTypesController::class, 'update']);
    Route::delete('/v1/benefit-types/{id}', [BenefitTypesController::class, 'destroy']);

    Route::post('/v1/benefit-budgets', [BenefitBudgetController::class, 'store']);
    Route::patch('/v1/benefit-budgets/{id}', [BenefitBudgetController::class, 'update']);
    Route::delete('/v1/benefit-budgets/{id}', [BenefitBudgetController::class, 'destroy']);

    Route::post('/v1/employee-benefit-balances/initialize', [EmployeeBenefitBalanceController::class, 'initialize']);

    Route::post('/v1/benefit-claims', [BenefitClaimController::class, 'store']);
    Route::put('/v1/benefit-claims/{id}', [BenefitClaimController::class, 'update']);
    Route::patch('/v1/benefit-claims/{id}', [BenefitClaimController::class, 'update']);
    Route::delete('/v1/benefit-claims/{id}', [BenefitClaimController::class, 'destroy']);
    Route::get('/v1/benefit-claims/export', [BenefitClaimController::class, 'export']);
    
    Route::post('/v1/auth/logout', [AuthController::class, 'logout']);
});


Route::get('/v1/level-employees', [LevelEmployeeController::class, 'index']);
Route::get('/v1/level-employees/{id}', [LevelEmployeeController::class, 'show']);

Route::get('/v1/marriage-statuses', [MarriageStatusController::class, 'index']);
Route::get('/v1/marriage-statuses/{id}', [MarriageStatusController::class, 'show']);

Route::get('/v1/employees', [EmployeeController::class, 'index']);
Route::get('/v1/employees/{id}', [EmployeeController::class, 'show']);

Route::get('/v1/benefit-types', [BenefitTypesController::class, 'index']);
Route::get('/v1/benefit-types/{id}', [BenefitTypesController::class, 'show']);

Route::get('/v1/benefit-budgets', [BenefitBudgetController::class, 'index']);
Route::get('/v1/benefit-budgets/{id}', [BenefitBudgetController::class, 'show']);

Route::get('/v1/employee-benefit-balances', [EmployeeBenefitBalanceController::class, 'index']);
Route::get('/v1/employee-benefit-balances/{id}', [EmployeeBenefitBalanceController::class, 'show']);

// Email tracking routes - no authentication required
Route::get('/v1/email-tracking/open', [App\Http\Controllers\EmailTrackingController::class, 'trackOpen']);
Route::post('/v1/email-tracking/click', [App\Http\Controllers\EmailTrackingController::class, 'trackClick']);

Route::get('/v1/benefit-claims', [BenefitClaimController::class, 'index']);
Route::get('/v1/benefit-claims/{id}', [BenefitClaimController::class, 'show']);

// Reports routes - JWT protected
Route::middleware('jwt')->group(function () {
    Route::get('/v1/reports/claims-summary', [App\Http\Controllers\ReportsController::class, 'claimsSummary']);
    Route::get('/v1/reports/employee-utilization', [App\Http\Controllers\ReportsController::class, 'employeeUtilization']);
    Route::get('/v1/reports/benefit-usage-stats', [App\Http\Controllers\ReportsController::class, 'benefitUsageStats']);
    Route::get('/v1/reports/trend-analysis', [App\Http\Controllers\ReportsController::class, 'trendAnalysis']);
    Route::get('/v1/reports/budget-vs-actual', [App\Http\Controllers\ReportsController::class, 'budgetVsActual']);
    Route::post('/v1/reports/export', [App\Http\Controllers\ReportsController::class, 'exportReport']);
    Route::get('/v1/reports/export/{exportId}/status', [App\Http\Controllers\ReportsController::class, 'getExportStatus']);
    Route::get('/v1/reports/export/{exportId}/download', [App\Http\Controllers\ReportsController::class, 'downloadExport']);
    
    // Balance Management routes - JWT protected
    Route::get('/v1/employee-balances/{employee_id}/summary', [App\Http\Controllers\BalanceManagementController::class, 'getEmployeeBalanceSummary']);
    Route::get('/v1/employee-balances/check', [App\Http\Controllers\BalanceManagementController::class, 'checkAvailableBalance']);
    Route::get('/v1/employee-balances/status', [App\Http\Controllers\BalanceManagementController::class, 'getBalanceStatus']);
    Route::post('/v1/employee-balances/process-transaction', [App\Http\Controllers\BalanceManagementController::class, 'processBalanceTransaction']);
    Route::post('/v1/employee-balances/adjust', [App\Http\Controllers\BalanceManagementController::class, 'adjustBalance']);
    Route::get('/v1/employee-balances/{employee_id}/history', [App\Http\Controllers\BalanceManagementController::class, 'getBalanceHistory']);
    Route::post('/v1/employee-balances/recalculate', [App\Http\Controllers\BalanceManagementController::class, 'recalculateBalances']);
    Route::get('/v1/employee-balances/alerts', [App\Http\Controllers\BalanceManagementController::class, 'getLowBalanceAlerts']);
});