<?php

namespace App\Providers;

use App\Models\BenefitClaims;
use App\Observers\BenefitClaimsObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model observers
        BenefitClaims::observe(BenefitClaimsObserver::class);
    }
}
