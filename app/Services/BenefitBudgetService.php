<?php

namespace App\Services;

use App\Models\Employees;
use App\Models\BenefitTypes;
use Illuminate\Http\Request;
use App\Models\BenefitBudgets;
use Illuminate\Database\Eloquent\Builder;

class BenefitBudgetService
{
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
            return $query->where('benefit_type_id', $benefitTypeId);
        }

        return $query;
    }

    /**
     * Apply level employee filter to the query.
     *
     * @param Builder $query
     * @param int|null $levelEmployeeId
     * @return Builder
     */
    public function applyLevelEmployeeFilter(Builder $query, ?int $levelEmployeeId): Builder
    {
        if ($levelEmployeeId) {
            return $query->where('level_employee_id', $levelEmployeeId);
        }

        return $query;
    }

    /**
     * Apply marriage status filter to the query.
     *
     * @param Builder $query
     * @param int|null $marriageStatusId
     * @return Builder
     */
    public function applyMarriageStatusFilter(Builder $query, ?int $marriageStatusId): Builder
    {
        if ($marriageStatusId) {
            return $query->where('marriage_status_id', $marriageStatusId);
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
            return $query->where('year', $year);
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
            'id', 'budget', 'created_at'
        ];

        if (in_array($sortBy, $allowedSortColumns)) {
            return $query->orderBy($sortBy, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Default sorting
        return $query->orderBy('id', 'asc');
    }

    /**
     * Get filtered and sorted BenefitBudgets.
     *
     * @param Request $request
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getFilteredBenefitBudgets(Request $request)
    {
        $query = BenefitBudgets::query();

        // Load relationships for efficient data retrieval
        $query->with(['benefitType', 'levelEmployees', 'marriageStatus']);

        // Apply filters
        $query = $this->applyBenefitTypeFilter($query, $request->benefit_type_id);
        $query = $this->applyLevelEmployeeFilter($query, $request->level_employee_id);
        $query = $this->applyMarriageStatusFilter($query, $request->marriage_status_id);
        $query = $this->applyYearFilter($query, $request->year);
        
        // Apply search filter if provided
        if ($search = $request->input('search')) {
            $searchTerm = strtolower(trim($search));
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('benefitType', function ($subQ) use ($searchTerm) {
                    $subQ->whereRaw('LOWER(name) LIKE ?', ["%{$searchTerm}%"]);
                })
                ->orWhereHas('levelEmployees', function ($subQ) use ($searchTerm) {
                    $subQ->whereRaw('LOWER(name) LIKE ?', ["%{$searchTerm}%"]);
                })
                ->orWhereHas('marriageStatus', function ($subQ) use ($searchTerm) {
                    $subQ->whereRaw('LOWER(description) LIKE ?', ["%{$searchTerm}%"]);
                })
                ->orWhere('year', 'LIKE', "%{$searchTerm}%")
                ->orWhere('budget', 'LIKE', "%{$searchTerm}%");
            });
        }

        // Apply sorting
        $sortBy = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_dir', 'asc');
        $query = $this->applySorting($query, $sortBy, $sortDirection);

        // Apply pagination
        $perPage = $request->input('per_page', 10);
        
        return $query->paginate($perPage)->appends($request->query());
    }

    /**
     * Get benefit type by ID.
     *
     * @param int $id
     * @return BenefitBudgets|null
     */
    public function getBenefitBudgetById(int $id)
    {
        return BenefitBudgets::with(['benefitType', 'levelEmployees', 'marriageStatus'])->find($id);
    }

    /**
     * Create a new benefit type.
     *
     * @param array $data
     * @return BenefitBudgets
     */
    public function create(array $data)
    {
        return BenefitBudgets::create($data);
    }

    /**
     * Update an benefit budgets.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function updateBenefitBudget(int $id, array $data)
    {
        $benefitBudget = BenefitBudgets::find($id);
        if ($benefitBudget) {
            $benefitBudget->update($data);
            return $benefitBudget;
        }
        return false;
    }

    /**
     * Delete an benefit budget.
     *
     * @param int $id
     * @return bool
     */
    public function deleteBenefitBudget(int $id)
    {
        $benefitBudget = BenefitBudgets::find($id);
        if ($benefitBudget) {
            return $benefitBudget->delete();
        }
        return false;
    }
}
