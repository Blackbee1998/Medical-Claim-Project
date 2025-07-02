<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Authentication routes
Route::get('/login-form', function (){
    return view('login-form.index');
})->name('login');

Route::get('/forgot-password', function (){
    return view('password.forgot-password');
});

Route::get('/reset-password', function (){
    return view('password.reset-password');
});

Route::get('/register-form', function (){
    return view('register-form.index');
});

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

// Dashboard route
Route::get('/', function (){
    return view('dashboard.index');
});

// Level Employees and Marriage Status routes
Route::get('/dashboard/level-employees', function (){
    return view('dashboard.level-employees');
});

Route::get('/dashboard/marriage-statuses', function (){
    return view('dashboard.marriage-statuses');
});

// Keeping the old routes for backwards compatibility
Route::get('/level-employees', function (){
    return redirect('/dashboard/level-employees');
});

Route::get('/marriage-statuses', function (){
    return redirect('/dashboard/marriage-statuses');
});

// Benefit Types and Budget routes
Route::get('/dashboard/benefit-types', function (){
    return view('dashboard.benefit-types');
});

Route::get('/dashboard/benefit-budgets', function (){
    return view('dashboard.benefit-budgets');
});

// Keeping the old routes for backwards compatibility
Route::get('/benefit-types', function (){
    return redirect('/dashboard/benefit-types');
});

Route::get('/benefit-budgets', function (){
    return redirect('/dashboard/benefit-budgets');
});

// Account routes
Route::get('/account/activity', [App\Http\Controllers\AccountController::class, 'activity'])
    ->name('account.activity');

// Employee routes
Route::get('/dashboard/employees', function (){        
    return view('employees.index');
});

// Keeping the old route for backwards compatibility
Route::get('/employees', function (){
    return redirect('/dashboard/employees');
});

// Employee Benefit Balances routes
Route::get('/dashboard/employee-benefit-balances', function (){
    return view('dashboard.employee-benefit-balances.index');
});

// Claims Processing routes
Route::get('/dashboard/claims-processing', function (){
    return view('dashboard.claims-processing.index');
});

Route::get('/dashboard/claims-history', function (){
    return view('dashboard.claims-history.index');
});

// Benefit routes
Route::get('/dashboard/benefit', function (){
    return view('benefit.index');
});

// Keeping the old route for backwards compatibility
Route::get('/benefit', function (){
    return redirect('/dashboard/benefit');
});