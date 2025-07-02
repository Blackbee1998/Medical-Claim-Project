<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\BenefitBudgetService;
use App\Http\Resources\BenefitBudgetResource;

class BenefitBudgetController extends Controller
{
    protected $benefitBudgetService;

    /**
     * Create a new controller instance.
     *
     * @param BenefitBudgetService $benefitBudgetService;
     * @return void
     */
    public function __construct(BenefitBudgetService $benefitBudgetService)
    {
        $this->benefitBudgetService = $benefitBudgetService;
    }
     public function index(Request $request)
    {
        try {
            $benefitBudgets = $this->benefitBudgetService->getFilteredBenefitBudgets($request);
            
            // Check if the result is empty
            if ($benefitBudgets->isEmpty()) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No benefit budgets found',
                    'data' => [],
                    'pagination' => [
                        'total' => 0,
                        'per_page' => $benefitBudgets->perPage(),
                        'current_page' => $benefitBudgets->currentPage(),
                        'last_page' => 0,
                        'from' => null,
                        'to' => null,
                    ],
                ], 404);
            }

            // Informasi pagination
            $paginationInfo = [
                'total' => $benefitBudgets->total(),
                'per_page' => $benefitBudgets->perPage(),
                'current_page' => $benefitBudgets->currentPage(),
                'last_page' => $benefitBudgets->lastPage(),
                'from' => $benefitBudgets->firstItem(),
                'to' => $benefitBudgets->lastItem(),
            ];

            // Return response dengan BenefitBudgetResource
            return response()->json([
                'status' => 200,
                'message' => 'Benefit budgets retrieved successfully',
                'data' => BenefitBudgetResource::collection($benefitBudgets),
                'pagination' => $paginationInfo
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve benefit budgets',
                'error' => 'An error occurred while fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified benefit budget.
     *
     * @param int $id
     * @return BenefitBudgetResource|JsonResponse
     */
    public function show($id)
    {
        try {
            $benefitBudget = $this->benefitBudgetService->getBenefitBudgetById($id);
        if (!$benefitBudget) {
            return response()->json([
                'status' => 404,
                'message' => 'Benefit budget not found',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Benefit budget retrieved successfully',
            'data' => new BenefitBudgetResource($benefitBudget),
        ], 200);
        }catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve benefit budget',
                'error' => 'An error occurred while fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created benefit budget in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'benefit_type_id' => 'required|exists:benefit_types,id',
                'level_employee_id' => 'required|exists:level_employees,id',
                'marriage_status_id' => 'nullable|exists:marriage_statuses,id',
                'year' => 'required|integer',
                'budget' => 'required|numeric',
            ]);

            $benefitBudget = $this->benefitBudgetService->create($data);

            $benefitBudget->load(['benefitType', 'levelEmployees', 'marriageStatus']);

            return response()->json([
                'status' => 201,
                'message' => 'Benefit budget created successfully',
                'data' => new BenefitBudgetResource($benefitBudget),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create benefit budget',
                'error' => 'An error occurred while creating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified benefit budget in storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'benefit_type_id' => 'required|exists:benefit_types,id',
                'level_employee_id' => 'required|exists:level_employees,id',
                'marriage_status_id' => 'nullable|exists:marriage_statuses,id',
                'year' => 'required|integer',
                'budget' => 'required|numeric',
            ]);

            $benefitBudget = $this->benefitBudgetService->updateBenefitBudget($id, $data);

            if (!$benefitBudget) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Benefit budget not found',
                    'data' => null,
                ], 404);
            }

            if (is_object($benefitBudget)) {
                $benefitBudget->load(['benefitType', 'levelEmployees', 'marriageStatus']);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Benefit budget updated successfully',
                'data' => new BenefitBudgetResource($benefitBudget),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update benefit budget',
                'error' => 'An error occurred while updating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified benefit budget from storage.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id)
    {
        try {
            $deleted = $this->benefitBudgetService->deleteBenefitBudget($id);

            if (!$deleted) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Benefit budget not found',
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Benefit budget deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete benefit budget',
                'error' => 'An error occurred while deleting data: ' . $e->getMessage()
            ], 500);
        }
    }
}
