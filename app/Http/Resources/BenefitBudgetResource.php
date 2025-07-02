<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BenefitBudgetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'benefit_type'=> $this->whenLoaded('benefitType', function(){
                return[
                    'id' => $this->benefitType->id,
                    'name' => $this->benefitType->name,
                ];
            }),
            'level_employee'=> $this->whenLoaded('levelEmployees', function(){
                return[
                    'id' => $this->levelEmployees->id,
                    'name' => $this->levelEmployees->name,
                ];
            }),
            'marriage_status'=> $this->whenLoaded('marriageStatus', function(){
                return[
                    'id' => $this->marriageStatus->id,
                    'code' => $this->marriageStatus->code,
                    'description' => $this->marriageStatus->description,
                ];
            }),
            'year'=> $this->year,
            'budget'=> $this->budget,
            'created_at'=> date_format($this->created_at, 'Y-m-d H:i:s'),
            'updated_at'=> date_format($this->updated_at, 'Y-m-d H:i:s'),
        ];
    }
}
