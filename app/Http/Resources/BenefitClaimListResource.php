<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Schema;

class BenefitClaimListResource extends JsonResource
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
            'claim_date' => $this->claim_date ? $this->claim_date->format('Y-m-d') : null,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->when(
                Schema::hasColumn('benefit_claims', 'created_by') && $this->relationLoaded('createdBy'),
                function () {
                    return $this->createdBy ? [
                        'id' => $this->createdBy->id,
                        'name' => $this->createdBy->name,
                    ] : null;
                }
            ),
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? $this->updated_at->format('Y-m-d\TH:i:s\Z') : null,
        ];
    }
}
