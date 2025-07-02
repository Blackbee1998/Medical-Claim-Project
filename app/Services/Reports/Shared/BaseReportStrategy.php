<?php

namespace App\Services\Reports\Shared;

use Illuminate\Support\Facades\Cache;
use App\Services\Reports\Contracts\ReportStrategyInterface;

abstract class BaseReportStrategy implements ReportStrategyInterface
{
    /**
     * Generate report with caching
     *
     * @param array $params
     * @return array
     */
    public function generate(array $params): array
    {
        $cacheKey = $this->getCacheKey($params);
        
        return Cache::remember($cacheKey, $this->getCacheDuration(), function () use ($params) {
            return $this->generateReport($params);
        });
    }

    /**
     * Abstract method to be implemented by concrete strategies
     *
     * @param array $params
     * @return array
     */
    abstract protected function generateReport(array $params): array;

    /**
     * Default cache duration (5 minutes)
     *
     * @return int
     */
    public function getCacheDuration(): int
    {
        return 300;
    }

    /**
     * Generate cache key based on class name and parameters
     *
     * @param array $params
     * @return string
     */
    public function getCacheKey(array $params): string
    {
        $className = class_basename(static::class);
        return strtolower($className) . '_' . md5(serialize($params));
    }

    /**
     * Basic parameter validation (override in concrete classes for specific validation)
     *
     * @param array $params
     * @return array|null
     */
    public function validateParams(array $params): ?array
    {
        // Basic validation - can be overridden
        return null;
    }

    /**
     * Helper method to build response with metadata
     *
     * @param array $data
     * @param array $params
     * @return array
     */
    protected function buildResponse(array $data, array $params): array
    {
        return array_merge($data, [
            'generated_at' => now()->toISOString(),
            'cache_key' => $this->getCacheKey($params),
        ]);
    }
} 