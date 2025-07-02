<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ReportsService;
use App\Services\ReportExportService;
use Illuminate\Support\Facades\Validator;

class ReportsController extends Controller
{
    protected ReportsService $reportsService;
    protected ReportExportService $exportService;

    public function __construct(ReportsService $reportsService, ReportExportService $exportService)
    {
        $this->reportsService = $reportsService;
        $this->exportService = $exportService;
    }

    /**
     * Generate claims summary report
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function claimsSummary(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'group_by' => 'required|in:department,benefit_type,employee_level,month,quarter',
                'department' => 'nullable|string',
                'benefit_type_id' => 'nullable|exists:benefit_types,id',
                'employee_level_id' => 'nullable|exists:level_employees,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $data = $this->reportsService->generateClaimsSummary($request->all());

            return response()->json([
                'status' => 200,
                'message' => 'Claims summary report generated successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate claims summary report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate employee utilization analysis
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function employeeUtilization(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
                'department' => 'nullable|string',
                'employee_level_id' => 'nullable|exists:level_employees,id',
                'sort_by' => 'nullable|in:usage_percentage,total_amount,claims_count',
                'sort_dir' => 'nullable|in:asc,desc',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $data = $this->reportsService->generateEmployeeUtilization($request->all());

            return response()->json([
                'status' => 200,
                'message' => 'Employee utilization analysis generated successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate employee utilization analysis',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate benefit usage statistics
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function benefitUsageStats(Request $request): JsonResponse
    {
        try {
            // Convert string boolean to actual boolean
            $params = $request->all();
            if (isset($params['compare_period'])) {
                $params['compare_period'] = filter_var($params['compare_period'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($params, [
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'compare_period' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $data = $this->reportsService->generateBenefitUsageStats($params);

            return response()->json([
                'status' => 200,
                'message' => 'Benefit usage statistics generated successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate benefit usage statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate time-based trend analysis
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function trendAnalysis(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period_type' => 'required|in:daily,weekly,monthly,quarterly',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'metric' => 'required|in:claims_count,total_amount,average_amount,unique_employees',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $data = $this->reportsService->generateTrendAnalysis($request->all());

            return response()->json([
                'status' => 200,
                'message' => 'Trend analysis generated successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate trend analysis',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate budget vs actual report
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function budgetVsActual(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
                'group_by' => 'required|in:department,benefit_type,employee_level',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $data = $this->reportsService->generateBudgetVsActual($request->all());

            return response()->json([
                'status' => 200,
                'message' => 'Budget vs actual report generated successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate budget vs actual report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export report data
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function exportReport(Request $request): JsonResponse
    {
        try {
            // Convert string boolean to actual boolean
            $params = $request->all();
            if (isset($params['include_charts'])) {
                $params['include_charts'] = filter_var($params['include_charts'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($params, [
                'report_type' => 'required|in:claims_summary,employee_utilization,benefit_usage_stats,trend_analysis,budget_vs_actual',
                'format' => 'required|in:csv,excel,pdf',
                'parameters' => 'required|array',
                'include_charts' => 'nullable|boolean',
                'template' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $data = $this->exportService->initiateExport($params);

            return response()->json([
                'status' => 200,
                'message' => 'Report export initiated successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to initiate report export',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get export status
     *
     * @param string $exportId
     * @return JsonResponse
     */
    public function getExportStatus(string $exportId): JsonResponse
    {
        try {
            $data = $this->exportService->getExportStatus($exportId);

            if (!$data) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Export not found',
                    'data' => null,
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Export status retrieved successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve export status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download exported report
     *
     * @param string $exportId
     * @return mixed
     */
    public function downloadExport(string $exportId)
    {
        try {
            return $this->exportService->downloadExport($exportId);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to download export',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
} 