<?php

namespace App\Services\Reports\Repositories;

use App\Models\BenefitClaims;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;

class ClaimsRepository
{
    /**
     * Get base approved claims query with common relationships
     *
     * @return Builder
     */
    public function getBaseQuery(): Builder
    {
        return BenefitClaims::approved()
            ->with(['employee.levelEmployees', 'employee.marriageStatuses', 'benefitType']);
    }

    /**
     * Get claims for date range with filters
     *
     * @param string $startDate
     * @param string $endDate
     * @param array $filters
     * @return Collection
     */
    public function getClaimsForPeriod(string $startDate, string $endDate, array $filters = []): Collection
    {
        $query = $this->getBaseQuery()->dateRange($startDate, $endDate);

        // Apply department filter
        if (!empty($filters['department'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('department', $filters['department']);
            });
        }

        // Apply benefit type filter
        if (!empty($filters['benefit_type_id'])) {
            $query->where('benefit_type_id', $filters['benefit_type_id']);
        }

        // Apply employee level filter
        if (!empty($filters['employee_level_id'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('level_employee_id', $filters['employee_level_id']);
            });
        }

        return $query->get();
    }

    /**
     * Get benefit-specific claims for period
     *
     * @param int $benefitTypeId
     * @param string $startDate
     * @param string $endDate
     * @return Collection
     */
    public function getBenefitClaimsForPeriod(int $benefitTypeId, string $startDate, string $endDate): Collection
    {
        return $this->getBaseQuery()
            ->where('benefit_type_id', $benefitTypeId)
            ->dateRange($startDate, $endDate)
            ->with('employee')
            ->get();
    }

    /**
     * Get employee claims for year
     *
     * @param int $employeeId
     * @param int $year
     * @return Collection
     */
    public function getEmployeeClaimsForYear(int $employeeId, int $year): Collection
    {
        return $this->getBaseQuery()
            ->where('employee_id', $employeeId)
            ->whereYear('claim_date', $year)
            ->get();
    }

    /**
     * Get claims statistics for period
     *
     * @param string $startDate
     * @param string $endDate
     * @param array $filters
     * @return array
     */
    public function getClaimsStatistics(string $startDate, string $endDate, array $filters = []): array
    {
        $claims = $this->getClaimsForPeriod($startDate, $endDate, $filters);

        return [
            'total_claims' => $claims->count(),
            'total_amount' => $claims->sum('amount'),
            'average_amount' => $claims->count() > 0 ? $claims->average('amount') : 0,
            'unique_employees' => $claims->unique('employee_id')->count(),
            'departments_count' => $claims->map(fn($claim) => $claim->employee->department)->unique()->count(),
        ];
    }
} 