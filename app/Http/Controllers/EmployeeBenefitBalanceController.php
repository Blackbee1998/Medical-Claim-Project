<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Services\EmployeeBenefitBalanceService;
use App\Http\Resources\EmployeeBenefitBalanceResource;

class EmployeeBenefitBalanceController extends Controller
{
    protected $employeeBenefitBalanceService;
    
    /**
     * Constructor
     *
     * @param EmployeeBenefitBalanceService $employeeBenefitBalanceService
     */
    public function __construct(EmployeeBenefitBalanceService $employeeBenefitBalanceService)
    {
        $this->employeeBenefitBalanceService = $employeeBenefitBalanceService;
    }
    
    /**
     * Get all employee benefit balances with pagination
     *
     * @param Request $request
     * @return EmployeeBenefitBalanceResource
     */
    public function index(Request $request)
    {
        $balances = $this->employeeBenefitBalanceService->getFilteredEmployeeBenefitBalance($request);
        
        // Check if the result is empty
        if ($balances->isEmpty()) {
            return response()->json([
                'status' => 404,
                'message' => 'No employee benefit balances found',
                'data' => [],
                'pagination' => [
                    'total' => 0,
                    'per_page' => $balances->perPage(),
                    'current_page' => $balances->currentPage(),
                    'last_page' => 0,
                    'from' => null,
                    'to' => null,
                ],
            ], 404);
        }
        
        return response()->json([
            'status' => 200,
            'message' => 'Employee benefit balances retrieved successfully',
            'data' => EmployeeBenefitBalanceResource::collection($balances),
            'pagination' => [
                'total' => $balances->total(),
                'per_page' => $balances->perPage(),
                'current_page' => $balances->currentPage(),
                'last_page' => $balances->lastPage(),
                'from' => $balances->firstItem(),
                'to' => $balances->lastItem(),
            ],
        ]);
    }
    
    /**
     * Get employee benefit balance by ID
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $balance = $this->employeeBenefitBalanceService->getById($id);
        
        if (!$balance) {
            return response()->json([
                'status' => 404,
                'message' => 'Employee benefit balance not found',
                'data' => null,
            ], 404);
        }
        
        return response()->json([
            'status' => 200,
            'message' => 'Employee benefit balance retrieved successfully',
            'data' => new EmployeeBenefitBalanceResource($balance)
        ]);
    }
    
    /**
     * Initialize employee benefit balances for a specific year
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function initialize(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
        'year' => 'required|integer|min:2000|max:2100',
        'employee_ids' => 'nullable|array',
        'employee_ids.*' => 'integer|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $year = $request->input('year');
        $employeeIds = $request->input('employee_ids');
        
        $result = $this->employeeBenefitBalanceService->initialize($year, $employeeIds);
        
        return response()->json($result, $result['status']);
    }
}
