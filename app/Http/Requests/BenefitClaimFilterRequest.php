<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BenefitClaimFilterRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => 'in:id,claim_date,amount,created_at,updated_at,employee_name,department,benefit_type,status',
            'sort_dir' => 'in:asc,desc',
            'employee_id' => 'integer|exists:employees,id',
            'benefit_type_id' => 'integer|exists:benefit_types,id',
            'start_date' => 'date|date_format:Y-m-d',
            'end_date' => 'date|date_format:Y-m-d|after_or_equal:start_date',
            'min_amount' => 'numeric|min:0',
            'max_amount' => 'numeric|min:0|gte:min_amount',
            'search' => 'string|max:255',
            'status' => 'in:pending,approved,rejected,processing'
        ];
    }

    public function messages()
    {
        return [
            'per_page.max' => 'Maximum items per page is 100',
            'sort_by.in' => 'Invalid sort field',
            'sort_dir.in' => 'Sort direction must be asc or desc',
            'employee_id.exists' => 'Employee not found',
            'benefit_type_id.exists' => 'Benefit type not found',
            'start_date.date_format' => 'Start date must be in YYYY-MM-DD format',
            'end_date.date_format' => 'End date must be in YYYY-MM-DD format',
            'end_date.after_or_equal' => 'End date must be after or equal to start date',
            'max_amount.gte' => 'Maximum amount must be greater than or equal to minimum amount',
            'status.in' => 'Status must be one of: pending, approved, rejected, processing'
        ];
    }
}