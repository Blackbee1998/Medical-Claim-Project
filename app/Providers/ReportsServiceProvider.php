<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Reports\ReportFactory;
use App\Services\Reports\Repositories\ClaimsRepository;
use App\Services\Reports\Repositories\EmployeeRepository;
use App\Services\Reports\Repositories\BudgetRepository;
use App\Services\Reports\Shared\DataGrouper;
use App\Services\ReportsService;

class ReportsServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        // Register shared utilities
        $this->app->singleton(DataGrouper::class, function ($app) {
            return new DataGrouper();
        });

        // Register repositories
        $this->app->singleton(ClaimsRepository::class, function ($app) {
            return new ClaimsRepository();
        });

        $this->app->singleton(EmployeeRepository::class, function ($app) {
            return new EmployeeRepository();
        });

        $this->app->singleton(BudgetRepository::class, function ($app) {
            return new BudgetRepository();
        });

        // Register report factory
        $this->app->singleton(ReportFactory::class, function ($app) {
            return new ReportFactory(
                $app->make(ClaimsRepository::class),
                $app->make(EmployeeRepository::class),
                $app->make(BudgetRepository::class),
                $app->make(DataGrouper::class)
            );
        });

        // Register the reports service
        $this->app->singleton(ReportsService::class, function ($app) {
            return new ReportsService(
                $app->make(ReportFactory::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
} 