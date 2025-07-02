<?php

namespace App\Services\Reports\Strategies;

use App\Services\Reports\Shared\BaseReportStrategy;
use App\Services\Reports\Repositories\ClaimsRepository;
use App\Models\BenefitTypes;
use Carbon\Carbon;

class BenefitUsageStatsStrategy extends BaseReportStrategy
{
    protected ClaimsRepository $claimsRepository;

    public function __construct(ClaimsRepository $claimsRepository)
    {
        $this->claimsRepository = $claimsRepository;
    }

    /**
     * Validate parameters for benefit usage statistics
     *
     * @param array $params
     * @return array|null
     */
    public function validateParams(array $params): ?array
    {
        $errors = [];

        if (empty($params['start_date'])) {
            $errors['start_date'] = 'Start date is required';
        }

        if (empty($params['end_date'])) {
            $errors['end_date'] = 'End date is required';
        }

        if (!empty($params['start_date']) && !empty($params['end_date'])) {
            $startDate = Carbon::parse($params['start_date']);
            $endDate = Carbon::parse($params['end_date']);
            
            if ($endDate->lt($startDate)) {
                $errors['end_date'] = 'End date must be after or equal to start date';
            }
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Generate benefit usage statistics
     *
     * @param array $params
     * @return array
     */
    protected function generateReport(array $params): array
    {
        $startDate = $params['start_date'];
        $endDate = $params['end_date'];
        $comparePeriod = $params['compare_period'] ?? false;

        $benefitTypes = BenefitTypes::all();
        $benefitStats = [];

        foreach ($benefitTypes as $benefitType) {
            $currentPeriodData = $this->getBenefitPeriodData($benefitType->id, $startDate, $endDate);

            $benefitStat = [
                'benefit_type' => [
                    'id' => $benefitType->id,
                    'name' => $benefitType->name,
                ],
                'current_period' => $currentPeriodData,
            ];

            if ($comparePeriod) {
                $periodLength = Carbon::parse($endDate)->diffInDays(Carbon::parse($startDate));
                $comparisonStartDate = Carbon::parse($startDate)->subDays($periodLength + 1)->toDateString();
                $comparisonEndDate = Carbon::parse($startDate)->subDay()->toDateString();

                $previousPeriodData = $this->getBenefitPeriodData($benefitType->id, $comparisonStartDate, $comparisonEndDate);

                $benefitStat['previous_period'] = $previousPeriodData;
                $benefitStat['comparison'] = $this->calculateComparison($currentPeriodData, $previousPeriodData);
            }

            $benefitStats[] = $benefitStat;
        }

        return $this->buildResponse([
            'report_period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'compare_period' => $comparePeriod,
            ],
            'benefit_types' => $benefitStats,
        ], $params);
    }

    /**
     * Get benefit period data
     *
     * @param int $benefitTypeId
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    private function getBenefitPeriodData(int $benefitTypeId, string $startDate, string $endDate): array
    {
        $claims = $this->claimsRepository->getBenefitClaimsForPeriod($benefitTypeId, $startDate, $endDate);

        $totalClaims = $claims->count();
        $totalAmount = $claims->sum('amount');
        $uniqueEmployees = $claims->unique('employee_id')->count();

        // Get department breakdown
        $departments = $claims->groupBy('employee.department')
            ->map(function ($deptClaims, $department) use ($totalAmount) {
                $deptAmount = $deptClaims->sum('amount');
                return [
                    'department' => $department,
                    'claims' => $deptClaims->count(),
                    'amount' => $deptAmount,
                    'percentage' => $totalAmount > 0 ? round(($deptAmount / $totalAmount) * 100, 2) : 0,
                ];
            })
            ->sortByDesc('amount')
            ->take(5)
            ->values()
            ->all();

        return [
            'total_claims' => $totalClaims,
            'total_amount' => $totalAmount,
            'average_claim' => $totalClaims > 0 ? $totalAmount / $totalClaims : 0,
            'unique_employees' => $uniqueEmployees,
            'top_departments' => $departments,
        ];
    }

    /**
     * Calculate comparison between periods
     *
     * @param array $current
     * @param array $previous
     * @return array
     */
    private function calculateComparison(array $current, array $previous): array
    {
        $claimsGrowth = $previous['total_claims'] > 0 
            ? (($current['total_claims'] - $previous['total_claims']) / $previous['total_claims']) * 100 
            : 0;

        $amountGrowth = $previous['total_amount'] > 0 
            ? (($current['total_amount'] - $previous['total_amount']) / $previous['total_amount']) * 100 
            : 0;

        $employeeGrowth = $previous['unique_employees'] > 0 
            ? (($current['unique_employees'] - $previous['unique_employees']) / $previous['unique_employees']) * 100 
            : 0;

        $trend = 'stable';
        if ($amountGrowth > 10) {
            $trend = 'increasing';
        } elseif ($amountGrowth < -10) {
            $trend = 'decreasing';
        }

        return [
            'claims_growth' => round($claimsGrowth, 2),
            'amount_growth' => round($amountGrowth, 2),
            'employee_growth' => round($employeeGrowth, 2),
            'trend' => $trend,
        ];
    }
} 