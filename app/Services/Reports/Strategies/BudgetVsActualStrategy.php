<?php

namespace App\Services\Reports\Strategies;

use App\Services\Reports\Shared\BaseReportStrategy;
use App\Services\Reports\Repositories\ClaimsRepository;
use App\Services\Reports\Repositories\BudgetRepository;

class BudgetVsActualStrategy extends BaseReportStrategy
{
    protected ClaimsRepository $claimsRepository;
    protected BudgetRepository $budgetRepository;

    public function __construct(
        ClaimsRepository $claimsRepository,
        BudgetRepository $budgetRepository
    ) {
        $this->claimsRepository = $claimsRepository;
        $this->budgetRepository = $budgetRepository;
    }

    /**
     * Validate parameters for budget vs actual report
     *
     * @param array $params
     * @return array|null
     */
    public function validateParams(array $params): ?array
    {
        $errors = [];
        $currentYear = date('Y');

        if (empty($params['group_by'])) {
            $errors['group_by'] = 'Group by parameter is required';
        } elseif (!in_array($params['group_by'], ['department', 'benefit_type', 'employee_level'])) {
            $errors['group_by'] = 'Invalid group by value';
        }

        if (isset($params['year'])) {
            $year = (int) $params['year'];
            if ($year < 2020 || $year > ($currentYear + 1)) {
                $errors['year'] = 'Year must be between 2020 and ' . ($currentYear + 1);
            }
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Generate budget vs actual report
     *
     * @param array $params
     * @return array
     */
    protected function generateReport(array $params): array
    {
        $year = (int) ($params['year'] ?? date('Y'));
        $groupBy = $params['group_by'];

        $groups = $this->budgetRepository->getBudgetGroups($groupBy, $year);
        $groupsData = [];
        $totalBudget = 0;
        $totalActual = 0;

        foreach ($groups as $group) {
            $groupData = $this->budgetRepository->calculateBudgetVsActualForGroup(
                $group,
                $groupBy,
                $year,
                $this->claimsRepository
            );

            $groupsData[] = $groupData;
            $totalBudget += $groupData['budget'];
            $totalActual += $groupData['actual'];
        }

        // Sort by variance (worst performing first)
        usort($groupsData, function ($a, $b) {
            return $b['variance_percentage'] <=> $a['variance_percentage'];
        });

        $totalVariance = $totalActual - $totalBudget;
        $totalVariancePercentage = $totalBudget > 0 ? ($totalVariance / $totalBudget) * 100 : 0;
        $overallUtilization = $totalBudget > 0 ? ($totalActual / $totalBudget) * 100 : 0;

        // Calculate statistics
        $overBudgetGroups = array_filter($groupsData, fn($g) => $g['status'] === 'over_budget');
        $nearBudgetGroups = array_filter($groupsData, fn($g) => $g['status'] === 'near_budget');
        $onTrackGroups = array_filter($groupsData, fn($g) => $g['status'] === 'on_track');
        $underUtilizedGroups = array_filter($groupsData, fn($g) => $g['status'] === 'under_utilized');

        return $this->buildResponse([
            'analysis_period' => [
                'year' => $year,
                'group_by' => $groupBy,
            ],
            'summary' => [
                'total_budget' => $totalBudget,
                'total_actual' => $totalActual,
                'total_variance' => $totalVariance,
                'variance_percentage' => round($totalVariancePercentage, 2),
                'overall_utilization' => round($overallUtilization, 2),
                'overall_status' => $this->determineOverallBudgetStatus($overallUtilization),
                'groups_breakdown' => [
                    'over_budget' => count($overBudgetGroups),
                    'near_budget' => count($nearBudgetGroups),
                    'on_track' => count($onTrackGroups),
                    'under_utilized' => count($underUtilizedGroups),
                ],
            ],
            'groups' => $groupsData,
            'insights' => [
                'highest_variance' => $this->getHighestVarianceGroup($groupsData),
                'lowest_utilization' => $this->getLowestUtilizationGroup($groupsData),
                'best_performer' => $this->getBestPerformerGroup($groupsData),
                'recommendations' => $this->generateRecommendations($groupsData, $overallUtilization),
            ],
        ], $params);
    }

    /**
     * Cache budget reports longer due to less frequent changes
     *
     * @return int
     */
    public function getCacheDuration(): int
    {
        return 900; // 15 minutes
    }

    /**
     * Determine overall budget status
     *
     * @param float $utilization
     * @return string
     */
    private function determineOverallBudgetStatus(float $utilization): string
    {
        if ($utilization >= 90) {
            return 'over_budget';
        } elseif ($utilization >= 80) {
            return 'near_budget';
        } elseif ($utilization >= 50) {
            return 'on_track';
        } else {
            return 'under_utilized';
        }
    }

    /**
     * Get group with highest variance
     *
     * @param array $groupsData
     * @return array|null
     */
    private function getHighestVarianceGroup(array $groupsData): ?array
    {
        if (empty($groupsData)) {
            return null;
        }

        $highest = null;
        $maxVariance = -INF;

        foreach ($groupsData as $group) {
            if ($group['variance_percentage'] > $maxVariance) {
                $maxVariance = $group['variance_percentage'];
                $highest = $group;
            }
        }

        return $highest;
    }

    /**
     * Get group with lowest utilization
     *
     * @param array $groupsData
     * @return array|null
     */
    private function getLowestUtilizationGroup(array $groupsData): ?array
    {
        if (empty($groupsData)) {
            return null;
        }

        $lowest = null;
        $minUtilization = INF;

        foreach ($groupsData as $group) {
            if ($group['utilization_rate'] < $minUtilization) {
                $minUtilization = $group['utilization_rate'];
                $lowest = $group;
            }
        }

        return $lowest;
    }

    /**
     * Get best performing group (closest to 80-90% utilization)
     *
     * @param array $groupsData
     * @return array|null
     */
    private function getBestPerformerGroup(array $groupsData): ?array
    {
        if (empty($groupsData)) {
            return null;
        }

        $best = null;
        $idealUtilization = 85; // Target 85%
        $smallestDiff = INF;

        foreach ($groupsData as $group) {
            $diff = abs($group['utilization_rate'] - $idealUtilization);
            if ($diff < $smallestDiff) {
                $smallestDiff = $diff;
                $best = $group;
            }
        }

        return $best;
    }

    /**
     * Generate recommendations based on budget analysis
     *
     * @param array $groupsData
     * @param float $overallUtilization
     * @return array
     */
    private function generateRecommendations(array $groupsData, float $overallUtilization): array
    {
        $recommendations = [];

        // Overall utilization recommendations
        if ($overallUtilization > 100) {
            $recommendations[] = [
                'type' => 'budget_increase',
                'priority' => 'high',
                'message' => 'Overall spending exceeds budget. Consider increasing budget allocation or implementing stricter controls.'
            ];
        } elseif ($overallUtilization < 50) {
            $recommendations[] = [
                'type' => 'budget_reallocation',
                'priority' => 'medium',
                'message' => 'Low overall utilization detected. Consider reallocating unused budget to high-demand areas.'
            ];
        }

        // Group-specific recommendations
        $overBudgetCount = count(array_filter($groupsData, fn($g) => $g['status'] === 'over_budget'));
        $underUtilizedCount = count(array_filter($groupsData, fn($g) => $g['status'] === 'under_utilized'));

        if ($overBudgetCount > 0) {
            $recommendations[] = [
                'type' => 'monitoring',
                'priority' => 'high',
                'message' => "{$overBudgetCount} group(s) are over budget. Implement monitoring and approval processes."
            ];
        }

        if ($underUtilizedCount > 0) {
            $recommendations[] = [
                'type' => 'utilization_improvement',
                'priority' => 'low',
                'message' => "{$underUtilizedCount} group(s) are under-utilizing their budget. Consider awareness campaigns or need assessment."
            ];
        }

        return $recommendations;
    }
} 