<?php

namespace App\Services\Reports\Strategies;

use App\Services\Reports\Shared\BaseReportStrategy;
use App\Services\Reports\Repositories\ClaimsRepository;
use Carbon\Carbon;

class TrendAnalysisStrategy extends BaseReportStrategy
{
    protected ClaimsRepository $claimsRepository;

    public function __construct(ClaimsRepository $claimsRepository)
    {
        $this->claimsRepository = $claimsRepository;
    }

    /**
     * Validate parameters for trend analysis
     *
     * @param array $params
     * @return array|null
     */
    public function validateParams(array $params): ?array
    {
        $errors = [];

        if (empty($params['period_type'])) {
            $errors['period_type'] = 'Period type is required';
        } elseif (!in_array($params['period_type'], ['daily', 'weekly', 'monthly', 'quarterly'])) {
            $errors['period_type'] = 'Invalid period type';
        }

        if (empty($params['start_date'])) {
            $errors['start_date'] = 'Start date is required';
        }

        if (empty($params['end_date'])) {
            $errors['end_date'] = 'End date is required';
        }

        if (empty($params['metric'])) {
            $errors['metric'] = 'Metric is required';
        } elseif (!in_array($params['metric'], ['claims_count', 'total_amount', 'average_amount', 'unique_employees'])) {
            $errors['metric'] = 'Invalid metric';
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
     * Generate time-based trend analysis
     *
     * @param array $params
     * @return array
     */
    protected function generateReport(array $params): array
    {
        $periodType = $params['period_type'];
        $startDate = $params['start_date'];
        $endDate = $params['end_date'];
        $metric = $params['metric'];

        $periods = $this->generatePeriods($periodType, $startDate, $endDate);
        $trendData = [];
        $previousValue = null;

        foreach ($periods as $period) {
            $periodData = $this->getPeriodMetricData($period, $metric);

            $trendEntry = [
                'period' => $period['key'],
                'period_label' => $period['label'],
                'value' => $periodData['value'],
                'claims_count' => $periodData['claims_count'],
                'unique_employees' => $periodData['unique_employees'],
                'growth_rate' => null,
            ];

            if ($previousValue !== null && $previousValue > 0) {
                $trendEntry['growth_rate'] = round((($periodData['value'] - $previousValue) / $previousValue) * 100, 2);
            }

            $trendData[] = $trendEntry;
            $previousValue = $periodData['value'];
        }

        $values = collect($trendData)->pluck('value');

        return $this->buildResponse([
            'analysis_config' => [
                'period_type' => $periodType,
                'metric' => $metric,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'trend_data' => $trendData,
            'summary' => [
                'total_periods' => count($trendData),
                'average_value' => $values->average(),
                'highest_period' => [
                    'period' => $trendData[array_search($values->max(), $values->toArray())]['period'],
                    'value' => $values->max(),
                ],
                'lowest_period' => [
                    'period' => $trendData[array_search($values->min(), $values->toArray())]['period'],
                    'value' => $values->min(),
                ],
                'overall_trend' => $this->determineTrend($trendData),
                'volatility' => $this->calculateVolatility($values->toArray()),
            ],
        ], $params);
    }

    /**
     * Generate periods for trend analysis
     *
     * @param string $periodType
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    private function generatePeriods(string $periodType, string $startDate, string $endDate): array
    {
        $periods = [];
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        switch ($periodType) {
            case 'daily':
                while ($start <= $end) {
                    $periods[] = [
                        'key' => $start->toDateString(),
                        'label' => $start->format('d M Y'),
                        'start' => $start->toDateString(),
                        'end' => $start->toDateString(),
                    ];
                    $start->addDay();
                }
                break;

            case 'weekly':
                $start->startOfWeek();
                while ($start <= $end) {
                    $weekEnd = $start->copy()->endOfWeek();
                    if ($weekEnd > $end) $weekEnd = $end;

                    $periods[] = [
                        'key' => $start->format('Y-W'),
                        'label' => 'Week of ' . $start->format('d M Y'),
                        'start' => $start->toDateString(),
                        'end' => $weekEnd->toDateString(),
                    ];
                    $start->addWeek();
                }
                break;

            case 'monthly':
                $start->startOfMonth();
                while ($start <= $end) {
                    $monthEnd = $start->copy()->endOfMonth();
                    if ($monthEnd > $end) $monthEnd = $end;

                    $periods[] = [
                        'key' => $start->format('Y-m'),
                        'label' => $start->format('F Y'),
                        'start' => $start->toDateString(),
                        'end' => $monthEnd->toDateString(),
                    ];
                    $start->addMonth();
                }
                break;

            case 'quarterly':
                $start->startOfQuarter();
                while ($start <= $end) {
                    $quarterEnd = $start->copy()->endOfQuarter();
                    if ($quarterEnd > $end) $quarterEnd = $end;

                    $periods[] = [
                        'key' => $start->format('Y-\QQ'),
                        'label' => 'Q' . $start->quarter . ' ' . $start->year,
                        'start' => $start->toDateString(),
                        'end' => $quarterEnd->toDateString(),
                    ];
                    $start->addQuarter();
                }
                break;
        }

        return $periods;
    }

    /**
     * Get period metric data
     *
     * @param array $period
     * @param string $metric
     * @return array
     */
    private function getPeriodMetricData(array $period, string $metric): array
    {
        $claims = $this->claimsRepository->getClaimsForPeriod($period['start'], $period['end']);

        $claimsCount = $claims->count();
        $totalAmount = $claims->sum('amount');
        $uniqueEmployees = $claims->unique('employee_id')->count();

        $value = match ($metric) {
            'claims_count' => $claimsCount,
            'total_amount' => $totalAmount,
            'average_amount' => $claimsCount > 0 ? $totalAmount / $claimsCount : 0,
            'unique_employees' => $uniqueEmployees,
            default => 0
        };

        return [
            'value' => $value,
            'claims_count' => $claimsCount,
            'unique_employees' => $uniqueEmployees,
        ];
    }

    /**
     * Determine overall trend
     *
     * @param array $trendData
     * @return string
     */
    private function determineTrend(array $trendData): string
    {
        if (count($trendData) < 2) {
            return 'insufficient_data';
        }

        $growthRates = collect($trendData)
            ->filter(fn($item) => $item['growth_rate'] !== null)
            ->pluck('growth_rate')
            ->toArray();

        if (empty($growthRates)) {
            return 'stable';
        }

        $avgGrowth = array_sum($growthRates) / count($growthRates);

        if ($avgGrowth > 5) {
            return 'increasing';
        } elseif ($avgGrowth < -5) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    /**
     * Calculate volatility
     *
     * @param array $values
     * @return float
     */
    private function calculateVolatility(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }

        $mean = array_sum($values) / count($values);
        $squaredDiffs = array_map(fn($value) => pow($value - $mean, 2), $values);
        $variance = array_sum($squaredDiffs) / count($values);

        return round(sqrt($variance), 2);
    }
} 