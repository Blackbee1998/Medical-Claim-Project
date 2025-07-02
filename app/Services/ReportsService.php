<?php

namespace App\Services;

use App\Services\Reports\ReportFactory;
use App\Services\Reports\Contracts\ReportStrategyInterface;
use InvalidArgumentException;
use Exception;

/**
 * Reports Service - Strategy Pattern Implementation
 * 
 * This service acts as the main orchestrator for all report generation.
 * It uses the Strategy pattern to delegate specific report logic to
 * dedicated strategy classes, making it more maintainable and extensible.
 */
class ReportsService
{
    protected ReportFactory $reportFactory;

    public function __construct(ReportFactory $reportFactory)
    {
        $this->reportFactory = $reportFactory;
    }

    /**
     * Generate claims summary report
     *
     * @param array $params
     * @return array
     * @throws Exception
     */
    public function generateClaimsSummary(array $params): array
    {
        return $this->generateReport('claims-summary', $params);
    }

    /**
     * Generate employee utilization analysis
     *
     * @param array $params
     * @return array
     * @throws Exception
     */
    public function generateEmployeeUtilization(array $params): array
    {
        return $this->generateReport('employee-utilization', $params);
    }

    /**
     * Generate benefit usage statistics
     *
     * @param array $params
     * @return array
     * @throws Exception
     */
    public function generateBenefitUsageStats(array $params): array
    {
        return $this->generateReport('benefit-usage-stats', $params);
    }

    /**
     * Generate time-based trend analysis
     *
     * @param array $params
     * @return array
     * @throws Exception
     */
    public function generateTrendAnalysis(array $params): array
    {
        return $this->generateReport('trend-analysis', $params);
    }

    /**
     * Generate budget vs actual report
     *
     * @param array $params
     * @return array
     * @throws Exception
     */
    public function generateBudgetVsActual(array $params): array
    {
        return $this->generateReport('budget-vs-actual', $params);
    }

    /**
     * Generic report generation method using Strategy pattern
     *
     * @param string $reportType
     * @param array $params
     * @return array
     * @throws InvalidArgumentException|Exception
     */
    protected function generateReport(string $reportType, array $params): array
    {
        try {
            // Get appropriate strategy for the report type
            $strategy = $this->reportFactory->createStrategy($reportType);

            // Validate parameters using strategy-specific validation
            $validationErrors = $strategy->validateParams($params);
            if ($validationErrors) {
                throw new InvalidArgumentException('Validation failed: ' . json_encode($validationErrors));
            }

            // Generate report using the strategy
            return $strategy->generate($params);

        } catch (InvalidArgumentException $e) {
            throw $e;
        } catch (Exception $e) {
            throw new Exception("Failed to generate {$reportType} report: " . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Get available report types
     *
     * @return array
     */
    public function getAvailableReportTypes(): array
    {
        return $this->reportFactory->getAvailableReportTypes();
    }

    /**
     * Validate parameters for a specific report type
     *
     * @param string $reportType
     * @param array $params
     * @return array|null Returns validation errors or null if valid
     * @throws InvalidArgumentException
     */
    public function validateReportParams(string $reportType, array $params): ?array
    {
        $strategy = $this->reportFactory->createStrategy($reportType);
        return $strategy->validateParams($params);
    }

    /**
     * Check if a report type is supported
     *
     * @param string $reportType
     * @return bool
     */
    public function isReportTypeSupported(string $reportType): bool
    {
        return in_array($reportType, $this->getAvailableReportTypes());
    }

    /**
     * Get cache key for a specific report
     *
     * @param string $reportType
     * @param array $params
     * @return string
     * @throws InvalidArgumentException
     */
    public function getReportCacheKey(string $reportType, array $params): string
    {
        $strategy = $this->reportFactory->createStrategy($reportType);
        return $strategy->getCacheKey($params);
    }

    /**
     * Clear cache for a specific report
     *
     * @param string $reportType
     * @param array $params
     * @return bool
     * @throws InvalidArgumentException
     */
    public function clearReportCache(string $reportType, array $params): bool
    {
        $cacheKey = $this->getReportCacheKey($reportType, $params);
        return \Illuminate\Support\Facades\Cache::forget($cacheKey);
    }

    /**
     * Clear all report caches (use with caution)
     *
     * @return bool
     */
    public function clearAllReportCaches(): bool
    {
        // Get all cache keys with pattern and flush them
        $tags = ['reports', 'claims_summary', 'employee_utilization', 'benefit_usage', 'trend_analysis', 'budget_actual'];
        
        foreach ($tags as $tag) {
            \Illuminate\Support\Facades\Cache::tags($tag)->flush();
        }

        return true;
    }

    /**
     * Get report generation metadata
     *
     * @param string $reportType
     * @return array
     * @throws InvalidArgumentException
     */
    public function getReportMetadata(string $reportType): array
    {
        if (!$this->isReportTypeSupported($reportType)) {
            throw new InvalidArgumentException("Unsupported report type: {$reportType}");
        }

        $strategy = $this->reportFactory->createStrategy($reportType);

        return [
            'report_type' => $reportType,
            'cache_duration' => $strategy->getCacheDuration(),
            'strategy_class' => get_class($strategy),
            'supported' => true,
        ];
    }

    /**
     * Batch generate multiple reports
     *
     * @param array $reportRequests Array of ['type' => string, 'params' => array]
     * @return array
     */
    public function batchGenerateReports(array $reportRequests): array
    {
        $results = [];

        foreach ($reportRequests as $index => $request) {
            try {
                if (!isset($request['type']) || !isset($request['params'])) {
                    $results[$index] = [
                        'success' => false,
                        'error' => 'Invalid request format. Required: type and params'
                    ];
                    continue;
                }

                $results[$index] = [
                    'success' => true,
                    'data' => $this->generateReport($request['type'], $request['params'])
                ];

            } catch (Exception $e) {
                $results[$index] = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Health check for the reports service
     *
     * @return array
     */
    public function healthCheck(): array
    {
        $availableTypes = $this->getAvailableReportTypes();
        $implementedStrategies = [];
        $errors = [];

        foreach ($availableTypes as $type) {
            try {
                $strategy = $this->reportFactory->createStrategy($type);
                $implementedStrategies[$type] = get_class($strategy);
            } catch (Exception $e) {
                $errors[$type] = $e->getMessage();
            }
        }

        return [
            'service_status' => 'healthy',
            'available_report_types' => count($availableTypes),
            'implemented_strategies' => count($implementedStrategies),
            'errors' => $errors,
            'strategies' => $implementedStrategies,
            'checked_at' => now()->toISOString(),
        ];
    }
} 