<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\EmployeeResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmployeeController extends Controller
{
    protected $employeeService;

    /**
     * Create a new controller instance.
     *
     * @param EmployeeService $employeeService
     * @return void
     */
    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }
    
    /**
     * Display a listing of employees with filtering, searching, and sorting.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Get filtered employees with relationships eager loaded
            $employees = $this->employeeService->getFilteredEmployees($request);
            
            // Handle empty results case with 404 status
            if ($employees->isEmpty()) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No Employees found',
                    'data' => [],
                    'pagination' => [
                        'total' => 0,
                        'per_page' => $employees->perPage(),
                        'current_page' => $employees->currentPage(),
                        'last_page' => 0,
                        'from' => null,
                        'to' => null,
                    ],
                ], 404);
            }

            // Pagination information
            $paginationInfo = [
                'total' => $employees->total(),
                'per_page' => $employees->perPage(),
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'from' => $employees->firstItem(),
                'to' => $employees->lastItem(),
            ];

            // Success response
            return response()->json([
                'status' => 200,
                'message' => 'Employees retrieved successfully',
                'data' => EmployeeResource::collection($employees),
                'pagination' => $paginationInfo
            ], 200);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Employee retrieval error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve employees',
                'error' => 'An error occurred while fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified employee.
     *
     * @param int $id
     * @return EmployeeResource|JsonResponse
     */
    public function show($id)
    {
        try {
            $employee = $this->employeeService->getEmployeeById($id);
            
            if (!$employee) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Employee not found',
                    'data' => null,
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Employee retrieved successfully',
                'data' => new EmployeeResource($employee),
            ], 200);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Employee retrieval error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve employee',
                'error' => 'An error occurred while fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created employee in storage.
     *
     * @param Request $request
     * @return EmployeeResource|JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'level_employee_id' => 'required|exists:level_employees,id',
                'marriage_status_id' => 'required|exists:marriage_statuses,id',
                'nik' => 'required|unique:employees,nik|max:20',
                'name' => 'required|string|max:255',
                'department' => 'required|string|max:255',
                'gender' => 'required|in:male,female'
            ]);

            $employee = $this->employeeService->createEmployee($validatedData);
            
            // Load relationships for the response
            $employee->load(['levelEmployees', 'marriageStatuses']);
            
            return response()->json([
                'status' => 201,
                'message' => 'Employee created successfully',
                'data' => new EmployeeResource($employee),
            ], 201);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Employee creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create employee',
                'error' => 'An error occurred while creating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified employee in storage.
     *
     * @param Request $request
     * @param int $id
     * @return EmployeeResource|JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validatedData = $request->validate([
                'level_employee_id' => 'nullable|exists:level_employees,id',
                'marriage_status_id' => 'nullable|exists:marriage_statuses,id',
                'nik' => 'nullable|unique:employees,nik,'.$id.'|max:20',
                'name' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
                'gender' => 'nullable|in:male,female'
            ]);

            $employee = $this->employeeService->updateEmployee($id, $validatedData);
            if (!$employee) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Employee not found',
                    'data' => null,
                ], 404);
            }

            // Ensure relationships are loaded
            $employee->load(['levelEmployees', 'marriageStatuses']);
            
            return response()->json([
                'status' => 200,
                'message' => 'Employee updated successfully',
                'data' => new EmployeeResource($employee),
            ], 200);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Employee update error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update employee',
                'error' => 'An error occurred while updating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified employee from storage.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            // Try to find the employee first
            $employee = $this->employeeService->getEmployeeById($id);
            
            if (!$employee) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Employee not found',
                ], 404);
            }

            // Use service method to delete
            $this->employeeService->deleteEmployee($id);
            
            return response()->json([
                'status' => 200,
                'message' => 'Employee deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Employee deletion error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete employee',
                'error' => 'An error occurred while deleting: ' . $e->getMessage()
            ], 500);
        }
    }
}
