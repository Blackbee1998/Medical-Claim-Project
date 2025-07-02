<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeBenefitBalanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee' => $this->whenLoaded('employee', function() {
                return [
                    'id' => $this->employee->id,
                    'name' => $this->employee->name,
                    'nik' => $this->employee->nik,
                ];
            }),
            'benefit_budget' => $this->whenLoaded('benefitBudget', function() {
                return [
                    'id' => $this->benefitBudget->id,
                    'benefit_type' => $this->benefitBudget->benefitType ? [
                        'id' => $this->benefitBudget->benefitType->id,
                        'name' => $this->benefitBudget->benefitType->name,
                    ] : null,
                    'year' => $this->benefitBudget->year,
                    'budget' => $this->benefitBudget->budget,
                ];
            }),
            'current_balance' => (float) $this->current_balance,
            'created_at' => $this->created_at ? date_format($this->created_at, 'Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? date_format($this->updated_at, 'Y-m-d H:i:s') : null,
        ];
    }
}
