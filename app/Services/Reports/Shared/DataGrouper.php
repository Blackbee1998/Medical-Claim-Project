<?php

namespace App\Services\Reports\Shared;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class DataGrouper
{
    /**
     * Group claims data by specified criteria
     *
     * @param Collection $claims
     * @param string $groupBy
     * @return array
     */
    public function groupClaims(Collection $claims, string $groupBy): array
    {
        $grouped = $claims->groupBy(function ($claim) use ($groupBy) {
            return $this->getGroupKey($claim, $groupBy);
        });

        $totalAmount = $claims->sum('amount');
        $result = [];

        foreach ($grouped as $key => $groupClaims) {
            $groupTotal = $groupClaims->sum('amount');
            $result[] = [
                'group_name' => $key,
                'claims_count' => $groupClaims->count(),
                'total_amount' => $groupTotal,
                'average_amount' => $groupClaims->average('amount'),
                'percentage' => $totalAmount > 0 ? round(($groupTotal / $totalAmount) * 100, 2) : 0,
                'unique_employees' => $groupClaims->unique('employee_id')->count(),
            ];
        }

        return collect($result)->sortByDesc('total_amount')->values()->all();
    }

    /**
     * Get the grouping key for a claim
     *
     * @param mixed $claim
     * @param string $groupBy
     * @return string
     */
    private function getGroupKey($claim, string $groupBy): string
    {
        switch ($groupBy) {
            case 'department':
                return $claim->employee->department ?? 'Unknown';
            case 'benefit_type':
                return $claim->benefitType->name ?? 'Unknown';
            case 'employee_level':
                return $claim->employee->levelEmployees->name ?? 'Unknown';
            case 'month':
                return Carbon::parse($claim->claim_date)->format('Y-m');
            case 'quarter':
                $date = Carbon::parse($claim->claim_date);
                return $date->year . '-Q' . $date->quarter;
            default:
                return 'Unknown';
        }
    }

    /**
     * Group employees by utilization categories
     *
     * @param array $employees
     * @return array
     */
    public function categorizeByUtilization(array $employees): array
    {
        $high = 0;
        $normal = 0;
        $low = 0;
        $zero = 0;

        foreach ($employees as $employee) {
            $usage = $employee['usage_percentage'];
            if ($usage >= 80) {
                $high++;
            } elseif ($usage <= 30) {
                $low++;
            } else {
                $normal++;
            }

            if ($usage == 0) {
                $zero++;
            }
        }

        return [
            'high_utilizers' => $high,
            'normal_utilizers' => $normal,
            'low_utilizers' => $low,
            'zero_utilizers' => $zero,
        ];
    }
} 