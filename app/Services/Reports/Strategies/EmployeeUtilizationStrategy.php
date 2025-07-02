<?php

namespace App\Services\Reports\Strategies;

use App\Services\Reports\Shared\BaseReportStrategy;
use App\Services\Reports\Repositories\ClaimsRepository;
use App\Services\Reports\Repositories\EmployeeRepository;
use App\Services\Reports\Shared\DataGrouper;

class EmployeeUtilizationStrategy extends BaseReportStrategy
{
    protected ClaimsRepository $claimsRepository;
    protected EmployeeRepository $employeeRepository;
    protected DataGrouper $dataGrouper;

    public function __construct(
        ClaimsRepository $claimsRepository,
        EmployeeRepository $employeeRepository,
        DataGrouper $dataGrouper
    ) {
        $this->claimsRepository = $claimsRepository;
        $this->employeeRepository = $employeeRepository;
        $this->dataGrouper = $dataGrouper;
    }

    /**
     * Validate parameters for employee utilization report
     *
     * @param array $params
     * @return array|null
     */
    public function validateParams(array $params): ?array
    {
        $errors = [];
        $currentYear = date('Y');

        if (isset($params['year'])) {
            $year = (int) $params['year'];
            if ($year < 2020 || $year > ($currentYear + 1)) {
                $errors['year'] = 'Year must be between 2020 and ' . ($currentYear + 1);
            }
        }

        if (isset($params['sort_by']) && !in_array($params['sort_by'], ['usage_percentage', 'total_amount', 'claims_count'])) {
            $errors['sort_by'] = 'Invalid sort_by value';
        }

        if (isset($params['sort_dir']) && !in_array($params['sort_dir'], ['asc', 'desc'])) {
            $errors['sort_dir'] = 'Invalid sort_dir value';
        }

        if (isset($params['page']) && ((int) $params['page']) < 1) {
            $errors['page'] = 'Page must be at least 1';
        }

        if (isset($params['per_page'])) {
            $perPage = (int) $params['per_page'];
            if ($perPage < 1 || $perPage > 100) {
                $errors['per_page'] = 'Per page must be between 1 and 100';
            }
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Employee utilization reports can be cached longer due to complexity
     *
     * @return int
     */
    public function getCacheDuration(): int
    {
        return 600; // 10 minutes
    }

    /**
     * Generate employee utilization analysis
     *
     * @param array $params
     * @return array
     */
    protected function generateReport(array $params): array
    {
        $year = (int) ($params['year'] ?? date('Y'));
        $department = $params['department'] ?? null;
        $employeeLevelId = $params['employee_level_id'] ?? null;
        $sortBy = $params['sort_by'] ?? 'usage_percentage';
        $sortDir = $params['sort_dir'] ?? 'desc';
        $page = (int) ($params['page'] ?? 1);
        $perPage = (int) ($params['per_page'] ?? 20);

        // Build filters
        $filters = array_filter([
            'department' => $department,
            'employee_level_id' => $employeeLevelId,
        ]);

        // Get employees with their benefit budgets
        $employees = $this->employeeRepository->getEmployeesWithBudgets($year, $filters);

        $utilization = [];
        foreach ($employees as $employee) {
            $employeeData = $this->employeeRepository->calculateEmployeeUtilization(
                $employee,
                $year,
                $this->claimsRepository
            );
            $utilization[] = $employeeData;
        }

        // Categorize utilization using DataGrouper
        $categories = $this->dataGrouper->categorizeByUtilization($utilization);

        // Map sort field if needed
        $actualSortBy = $sortBy === 'total_amount' ? 'total_used' : $sortBy;

        // Sort the data
        $utilization = collect($utilization)
            ->sortBy($actualSortBy, SORT_REGULAR, $sortDir === 'desc')
            ->values()
            ->all();

        // Paginate results
        $total = count($utilization);
        $offset = ($page - 1) * $perPage;
        $paginatedData = array_slice($utilization, $offset, $perPage);

        return $this->buildResponse([
            'analysis_period' => [
                'year' => $year,
                'filters_applied' => $filters,
            ],
            'summary' => [
                'total_employees' => $total,
                'employees_with_claims' => collect($utilization)->where('claims_count', '>', 0)->count(),
                'average_utilization' => collect($utilization)->average('usage_percentage'),
                'high_utilizers' => $categories['high_utilizers'],
                'normal_utilizers' => $categories['normal_utilizers'],
                'low_utilizers' => $categories['low_utilizers'],
                'zero_utilizers' => $categories['zero_utilizers'],
            ],
            'employees' => $paginatedData,
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => ceil($total / $perPage),
                'from' => $offset + 1,
                'to' => min($offset + $perPage, $total),
            ],
        ], $params);
    }
} 