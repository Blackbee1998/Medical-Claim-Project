<?php

namespace App\Services;


use Illuminate\Http\Request;
use App\Models\EmployeeBenefitBalances;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class EmployeeBenefitBalanceService
{
    protected $initializeService;
    
    /**
     * Constructor
     *
     * @param BalanceInitializeService $initializeService
     */
    public function __construct(BalanceInitializeService $initializeService)
    {
        $this->initializeService = $initializeService;
    }

    /**
     * Apply employee filter to the query.
     *
     * @param Builder $query
     * @param string|null $employeeId
     * @return Builder
     */
    public function applyEmployeeFilter(Builder $query, ?string $employeeId): Builder
    {
        if ($employeeId) {
            return $query->where('employee_id', $employeeId);
        }

        return $query;
    }

    /**
     * Apply benefit type filter to the query.
     *
     * @param Builder $query
     * @param string|null $benefitTypeId
     * @return Builder
     */
    public function applyBenefitTypeFilter(Builder $query, ?string $benefitTypeId): Builder
    {
        if ($benefitTypeId) {
            return $query->whereHas('benefitBudget', function (Builder $query) use ($benefitTypeId) {
                $query->where('benefit_type_id', $benefitTypeId);
            });
        }

        return $query;
    }

    /**
     * Apply year filter to the query.
     *
     * @param Builder $query
     * @param string|null $year
     * @return Builder
     */
    public function applyYearFilter(Builder $query, ?string $year): Builder
    {
        if ($year) {
            return $query->whereHas('benefitBudget', function (Builder $query) use ($year) {
                $query->where('year', $year);
            });
        }

        return $query;
    }

    /**
     * Apply sorting to the query.
     *
     * @param Builder $query
     * @param string $sortBy
     * @param string $sortDirection
     * @return Builder
     */
    public function applySorting(Builder $query, string $sortBy, string $sortDirection): Builder
    {
        // Allowed columns for sorting
        $allowedSortColumns = [
            'id', 'current_balance', 'created_at'
        ];

        if (in_array($sortBy, $allowedSortColumns)) {
            return $query->orderBy($sortBy, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Default sorting
        return $query->orderBy('id', 'asc');
    }

    /**
     * Get filtered and sorted EmployeeBenefitBalance.
     *
     * @param Request $request
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getFilteredEmployeeBenefitBalance(Request $request)
    {
        $query = EmployeeBenefitBalances::with([
            'employee:id,name,nik,department',
            'benefitBudget',
            'benefitBudget.benefitType:id,name'
        ]);

        // Apply filters
        $query = $this->applyEmployeeFilter($query, $request->employee_id);
        $query = $this->applyBenefitTypeFilter($query, $request->benefit_type_id);
        $query = $this->applyYearFilter($query, $request->year);

        // Apply sorting
        $sortBy = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_dir', 'asc');
        $query = $this->applySorting($query, $sortBy, $sortDirection);

        // Apply pagination (pastikan ini di akhir setelah query siap)
        $perPage = $request->input('per_page', 10);
        
        // Kembalikan hasil dengan pagination
        return $query->paginate($perPage)->appends($request->query());
    }

    
    /**
     * Get employee benefit balance by ID
     *
     * @param int $id
     * @return EmployeeBenefitBalances|null
     */
    public function getById(int $id): ?EmployeeBenefitBalances
    {
        return EmployeeBenefitBalances::with([
            'employee:id,name,nik,department',
            'benefitBudget',
            'benefitBudget.benefitType:id,name'
        ])->find($id);
    }
    
    /**
     * Initialize employee benefit balances (delegate to specialized service)
     *
     * @param int $year
     * @param array|null $employeeIds
     * @return array
     */
    public function initialize(int $year, ?array $employeeIds = null): array
    {
        return $this->initializeService->initialize($year, $employeeIds);
    }
}
