<?php

namespace App\Services\Reports;

use App\Services\Reports\Contracts\ReportStrategyInterface;
use App\Services\Reports\Strategies\ClaimsSummaryStrategy;
use App\Services\Reports\Strategies\EmployeeUtilizationStrategy;
use App\Services\Reports\Strategies\BenefitUsageStatsStrategy;
use App\Services\Reports\Strategies\TrendAnalysisStrategy;
use App\Services\Reports\Strategies\BudgetVsActualStrategy;
use App\Services\Reports\Repositories\ClaimsRepository;
use App\Services\Reports\Repositories\EmployeeRepository;
use App\Services\Reports\Repositories\BudgetRepository;
use App\Services\Reports\Shared\DataGrouper;
use InvalidArgumentException;

class ReportFactory
{
    protected ClaimsRepository $claimsRepository;
    protected EmployeeRepository $employeeRepository;
    protected BudgetRepository $budgetRepository;
    protected DataGrouper $dataGrouper;

    public function __construct(
        ClaimsRepository $claimsRepository,
        EmployeeRepository $employeeRepository,
        BudgetRepository $budgetRepository,
        DataGrouper $dataGrouper
    ) {
        $this->claimsRepository = $claimsRepository;
        $this->employeeRepository = $employeeRepository;
        $this->budgetRepository = $budgetRepository;
        $this->dataGrouper = $dataGrouper;
    }

    /**
     * Create report strategy based on report type
     *
     * @param string $reportType
     * @return ReportStrategyInterface
     * @throws InvalidArgumentException
     */
    public function createStrategy(string $reportType): ReportStrategyInterface
    {
        switch ($reportType) {
            case 'claims-summary':
                return new ClaimsSummaryStrategy($this->claimsRepository, $this->dataGrouper);
            
            case 'employee-utilization':
                return new EmployeeUtilizationStrategy(
                    $this->claimsRepository,
                    $this->employeeRepository,
                    $this->dataGrouper
                );
            
            case 'benefit-usage-stats':
                return new BenefitUsageStatsStrategy($this->claimsRepository);
            
            case 'trend-analysis':
                return new TrendAnalysisStrategy($this->claimsRepository);
            
            case 'budget-vs-actual':
                return new BudgetVsActualStrategy(
                    $this->claimsRepository,
                    $this->budgetRepository
                );
            
            default:
                throw new InvalidArgumentException("Unknown report type: {$reportType}");
        }
    }

    /**
     * Get list of available report types
     *
     * @return array
     */
    public function getAvailableReportTypes(): array
    {
        return [
            'claims-summary',
            'employee-utilization', 
            'benefit-usage-stats',
            'trend-analysis',
            'budget-vs-actual',
        ];
    }
} 