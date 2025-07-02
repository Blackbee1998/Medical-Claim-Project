<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Schema;

class BenefitClaimResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'benefit_type_id' => $this->benefit_type_id,
            'claim_number' => $this->claim_number,
            'claim_date' => $this->claim_date ? $this->claim_date->format('Y-m-d') : null,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'employee' => $this->whenLoaded('employee', function () {
                return [
                    'id' => $this->employee->id,
                    'name' => $this->employee->name,
                    'nik' => $this->employee->nik,
                    'department' => $this->employee->department
                ];
            }),
            'benefit_type' => $this->whenLoaded('benefitType', function () {
                return [
                    'id' => $this->benefitType->id,
                    'name' => $this->benefitType->name
                ];
            }),
            'notes' => $this->notes,
            'receipt_file' => $this->receipt_file,
            'created_by' => $this->when(
                Schema::hasColumn('benefit_claims', 'created_by') && $this->relationLoaded('createdBy'),
                function () {
                    return $this->createdBy ? [
                        'id' => $this->createdBy->id,
                        'name' => $this->createdBy->name,
                        'email' => $this->createdBy->email,
                    ] : null;
                }
            ),
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? $this->updated_at->format('Y-m-d\TH:i:s\Z') : null,
        ];
    }
}
