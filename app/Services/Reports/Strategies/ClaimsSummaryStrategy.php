<?php

namespace App\Services\Reports\Strategies;

use App\Services\Reports\Shared\BaseReportStrategy;
use App\Services\Reports\Repositories\ClaimsRepository;
use App\Services\Reports\Shared\DataGrouper;

class ClaimsSummaryStrategy extends BaseReportStrategy
{
    protected ClaimsRepository $claimsRepository;
    protected DataGrouper $dataGrouper;

    public function __construct(ClaimsRepository $claimsRepository, DataGrouper $dataGrouper)
    {
        $this->claimsRepository = $claimsRepository;
        $this->dataGrouper = $dataGrouper;
    }

    /**
     * Validate parameters for claims summary report
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

        if (empty($params['group_by'])) {
            $errors['group_by'] = 'Group by parameter is required';
        } elseif (!in_array($params['group_by'], ['department', 'benefit_type', 'employee_level', 'month', 'quarter'])) {
            $errors['group_by'] = 'Invalid group by value';
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Generate claims summary report
     *
     * @param array $params
     * @return array
     */
    protected function generateReport(array $params): array
    {
        $startDate = $params['start_date'];
        $endDate = $params['end_date'];
        $groupBy = $params['group_by'];

        // Build filters
        $filters = array_filter([
            'department' => $params['department'] ?? null,
            'benefit_type_id' => $params['benefit_type_id'] ?? null,
            'employee_level_id' => $params['employee_level_id'] ?? null,
        ]);

        // Get claims and statistics
        $claims = $this->claimsRepository->getClaimsForPeriod($startDate, $endDate, $filters);
        $summary = $this->claimsRepository->getClaimsStatistics($startDate, $endDate, $filters);

        // Group data
        $groupedData = $this->dataGrouper->groupClaims($claims, $groupBy);

        return $this->buildResponse([
            'report_period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy,
            ],
            'summary' => $summary,
            'grouped_data' => $groupedData,
        ], $params);
    }
} 