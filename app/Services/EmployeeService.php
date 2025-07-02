<?php

namespace App\Services;

use App\Models\Employees;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class EmployeeService
{
    /**
     * Apply search filter to the query.
     *
     * @param Builder $query
     * @param string|null $searchTerm
     * @return Builder
     */
    public function applySearchFilter(Builder $query, ?string $searchTerm): Builder
    {
        if ($searchTerm) {
            return $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('nik', 'like', "%{$searchTerm}%")
                  ->orWhere('department', 'like', "%{$searchTerm}%");
            });
        }

        return $query;
    }

    /**
     * Apply department filter to the query.
     *
     * @param Builder $query
     * @param string|null $department
     * @return Builder
     */
    public function applyDepartmentFilter(Builder $query, ?string $department): Builder
    {
        if ($department) {
            return $query->where('department', $department);
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
     * Apply gender filter to the query.
     *
     * @param Builder $query
     * @param string|null $gender
     * @return Builder
     */
    public function applyGenderFilter(Builder $query, ?string $gender): Builder
    {
        if ($gender) {
            return $query->where('gender', $gender);
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
            'id', 'name', 'nik', 'department', 'created_at'
        ];

        if (in_array($sortBy, $allowedSortColumns)) {
            return $query->orderBy($sortBy, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Default sorting
        return $query->orderBy('id', 'asc');
    }

    /**
     * Get filtered and sorted employees.
     *
     * @param Request $request
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getFilteredEmployees(Request $request)
    {
        // Start with a query that eager loads the relationships
        $query = Employees::with(['levelEmployees', 'marriageStatuses']);

        // Apply filters
        $query = $this->applySearchFilter($query, $request->search);
        $query = $this->applyDepartmentFilter($query, $request->department);
        $query = $this->applyLevelEmployeeFilter($query, $request->level_employee_id);
        $query = $this->applyMarriageStatusFilter($query, $request->marriage_status_id);
        $query = $this->applyGenderFilter($query, $request->gender);

        // Apply sorting
        $sortBy = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_dir', 'asc');
        $query = $this->applySorting($query, $sortBy, $sortDirection);

        // Apply pagination
        $perPage = $request->input('per_page', 10);
        
        return $query->paginate($perPage)->appends($request->query());
    }

    /**
     * Get employee by ID.
     *
     * @param int $id
     * @return Employees|null
     */
    public function getEmployeeById(int $id)
    {
        return Employees::with(['levelEmployees', 'marriageStatuses'])->find($id);
    }

    /**
     * Create a new employee.
     *
     * @param array $data
     * @return Employees
     */
    public function createEmployee(array $data)
    {
        return Employees::create($data);
    }

    /**
     * Update an employee.
     *
     * @param int $id
     * @param array $data
     * @return Employees|null
     */
    public function updateEmployee(int $id, array $data)
    {
        $employee = Employees::find($id);
        
        if (!$employee) {
            return null;
        }
        
        $employee->update($data);
        return $employee->fresh();
    }

    /**
     * Delete an employee.
     *
     * @param int $id
     * @return bool
     */
    public function deleteEmployee(int $id)
    {
        $employee = Employees::find($id);
        if ($employee) {
            return $employee->delete();
        }
        return false;
    }
}
