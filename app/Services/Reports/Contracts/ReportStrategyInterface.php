<?php

namespace App\Services\Reports\Contracts;

interface ReportStrategyInterface
{
    /**
     * Generate report data based on provided parameters
     *
     * @param array $params
     * @return array
     */
    public function generate(array $params): array;

    /**
     * Validate report parameters
     *
     * @param array $params
     * @return array|null Returns validation errors or null if valid
     */
    public function validateParams(array $params): ?array;

    /**
     * Get report cache key
     *
     * @param array $params
     * @return string
     */
    public function getCacheKey(array $params): string;

    /**
     * Get cache duration in seconds
     *
     * @return int
     */
    public function getCacheDuration(): int;
} 