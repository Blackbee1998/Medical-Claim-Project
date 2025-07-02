<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'nik' => $this->nik,
            'name' => $this->name,
            'department' => $this->department,
            'gender' => $this->gender,
            
            // Always include level_employee object, using null safe operator
            'level_employee' => $this->whenLoaded('levelEmployees', function () {
                return $this->levelEmployees ? [
                    'id' => $this->levelEmployees->id,
                    'name' => $this->levelEmployees->name,
                ] : null;
            }),
            
            // Always include marriage_status object, using null safe operator
            'marriage_status' => $this->whenLoaded('marriageStatuses', function () {
                return $this->marriageStatuses ? [
                    'id' => $this->marriageStatuses->id,
                    'code' => $this->marriageStatuses->code,
                    'description' => $this->marriageStatuses->description,
                ] : null;
            }),
            
            // Format dates to ISO 8601 format as requested
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
