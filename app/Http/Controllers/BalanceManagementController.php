<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Services\BalanceManagementService;

class BalanceManagementController extends Controller
{
    protected $balanceService;

    /**
     * Constructor
     */
    public function __construct(BalanceManagementService $balanceService)
    {
        $this->balanceService = $balanceService;
    }

    /**
     * Get Employee Balance Summary
     * GET /api/v1/employee-balances/{employee_id}/summary
     */
    public function getEmployeeBalanceSummary(Request $request, int $employeeId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $year = $request->input('year', now()->year);
            $data = $this->balanceService->getEmployeeBalanceSummary($employeeId, $year);

            return response()->json([
                'status' => 200,
                'message' => 'Employee balance summary retrieved successfully',
                'data' => $data,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);
        }
    }

    /**
     * Get Balance Status with Overdraft Information
     * GET /api/v1/employee-balances/status
     */
    public function getBalanceStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|integer|exists:employees,id',
            'benefit_type_id' => 'required|integer|exists:benefit_types,id',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $employeeId = $request->input('employee_id');
            $benefitTypeId = $request->input('benefit_type_id');
            $year = $request->input('year', now()->year);

            $data = $this->balanceService->getBalanceStatus($employeeId, $benefitTypeId, $year);

            return response()->json([
                'status' => 200,
                'message' => 'Balance status retrieved successfully',
                'data' => $data,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);
        }
    }

    /**
     * Check Available Balance
     * GET /api/v1/employee-balances/check
     */
    public function checkAvailableBalance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|integer|exists:employees,id',
            'benefit_type_id' => 'required|integer|exists:benefit_types,id',
            'amount' => 'required|numeric|min:0',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $employeeId = $request->input('employee_id');
            $benefitTypeId = $request->input('benefit_type_id');
            $amount = $request->input('amount');
            $year = $request->input('year', now()->year);

            $data = $this->balanceService->checkAvailableBalance($employeeId, $benefitTypeId, $amount, $year);

            return response()->json([
                'status' => 200,
                'message' => 'Balance check completed',
                'data' => $data,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);
        }
    }

    /**
     * Process Balance Transaction
     * POST /api/v1/employee-balances/process-transaction
     */
    public function processBalanceTransaction(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|integer|exists:employees,id',
            'benefit_type_id' => 'required|integer|exists:benefit_types,id',
            'transaction_type' => 'required|in:debit,credit',
            'amount' => 'required|numeric|min:0',
            'reference_type' => 'required|in:claim,adjustment',
            'reference_id' => 'nullable|integer',
            'description' => 'nullable|string|max:1000',
            'year' => 'required|integer|min:2000|max:2100',
            'allow_overdraft' => 'nullable|boolean',
            'is_emergency' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->only([
                'employee_id', 'benefit_type_id', 'transaction_type', 'amount',
                'reference_type', 'reference_id', 'description', 'year',
                'allow_overdraft', 'is_emergency'
            ]);

            // Get current user ID from JWT token
            $userId = auth()->id();

            $result = $this->balanceService->processBalanceTransaction($data, $userId);

            return response()->json([
                'status' => 200,
                'message' => 'Balance transaction processed successfully',
                'data' => $result,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }

    /**
     * Manual Balance Adjustment
     * POST /api/v1/employee-balances/adjust
     */
    public function adjustBalance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|integer|exists:employees,id',
            'benefit_type_id' => 'required|integer|exists:benefit_types,id',
            'adjustment_type' => 'required|in:increase,decrease',
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:1000',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->only([
                'employee_id', 'benefit_type_id', 'adjustment_type', 'amount', 'reason', 'year'
            ]);

            // Get current user ID from JWT token
            $userId = auth()->id();

            $result = $this->balanceService->adjustBalance($data, $userId);

            return response()->json([
                'status' => 200,
                'message' => 'Balance adjustment completed successfully',
                'data' => $result,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }

    /**
     * Get Balance History
     * GET /api/v1/employee-balances/{employee_id}/history
     */
    public function getBalanceHistory(Request $request, int $employeeId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'benefit_type_id' => 'nullable|integer|exists:benefit_types,id',
            'year' => 'nullable|integer|min:2000|max:2100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'transaction_type' => 'nullable|in:debit,credit',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $filters = $request->only([
                'benefit_type_id', 'year', 'start_date', 'end_date', 'transaction_type', 'per_page'
            ]);

            $history = $this->balanceService->getBalanceHistory($employeeId, $filters);

            // Transform data for response
            $data = $history->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_id' => $transaction->transaction_id,
                    'transaction_type' => $transaction->transaction_type,
                    'amount' => (float) $transaction->amount,
                    'balance_before' => (float) $transaction->balance_before,
                    'balance_after' => (float) $transaction->balance_after,
                    'reference_type' => $transaction->reference_type,
                    'reference_id' => $transaction->reference_id,
                    'description' => $transaction->description,
                    'benefit_type' => [
                        'id' => $transaction->benefitType->id,
                        'name' => $transaction->benefitType->name,
                    ],
                    'processed_at' => $transaction->created_at->toISOString(),
                    'processed_by' => $transaction->processedBy ? [
                        'id' => $transaction->processedBy->id,
                        'name' => $transaction->processedBy->name,
                    ] : null,
                ];
            });

            return response()->json([
                'status' => 200,
                'message' => 'Balance history retrieved successfully',
                'data' => $data,
                'pagination' => [
                    'total' => $history->total(),
                    'per_page' => $history->perPage(),
                    'current_page' => $history->currentPage(),
                    'last_page' => $history->lastPage(),
                    'from' => $history->firstItem(),
                    'to' => $history->lastItem(),
                ],
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }

    /**
     * Recalculate Employee Balances
     * POST /api/v1/employee-balances/recalculate
     */
    public function recalculateBalances(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'integer|exists:employees,id',
            'year' => 'required|integer|min:2000|max:2100',
            'benefit_type_ids' => 'nullable|array',
            'benefit_type_ids.*' => 'integer|exists:benefit_types,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->only(['employee_ids', 'year', 'benefit_type_ids']);
            $result = $this->balanceService->recalculateBalances($data);

            return response()->json([
                'status' => 200,
                'message' => 'Balance recalculation completed successfully',
                'data' => $result,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }

    /**
     * Get Low Balance Alerts
     * GET /api/v1/employee-balances/alerts
     */
    public function getLowBalanceAlerts(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'threshold_percentage' => 'nullable|numeric|min:0|max:100',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $thresholdPercentage = $request->input('threshold_percentage', 20);
            $year = $request->input('year', now()->year);

            $data = $this->balanceService->getLowBalanceAlerts($thresholdPercentage, $year);

            return response()->json([
                'status' => 200,
                'message' => 'Low balance alerts retrieved successfully',
                'data' => $data,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }
}