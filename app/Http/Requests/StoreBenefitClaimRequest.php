<?php

namespace App\Http\Requests;

use App\Rules\BenefitBalanceRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;

class StoreBenefitClaimRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'benefit_type_id' => 'required|exists:benefit_types,id',
            'claim_date' => 'required|date|before_or_equal:today',
            'amount' => [
                'required',
                'numeric',
                'min:0',
                'max:999999999999.99',
                new BenefitBalanceRule(
                    $this->employee_id, 
                    $this->claim_date, 
                    $this->benefit_type_id
                )
            ],
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,approved,rejected,processing',
            'notes' => 'nullable|string|max:500',
            'receipt_file' => 'nullable|string|max:255'
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'employee_id.required' => 'Employee ID is required',
            'employee_id.exists' => 'Employee not found',
            'benefit_type_id.required' => 'Benefit type ID is required', 
            'benefit_type_id.exists' => 'Benefit type not found',
            'claim_date.required' => 'Claim date is required',
            'claim_date.date' => 'Claim date must be a valid date',
            'claim_date.before_or_equal' => 'Claim date cannot be in the future',
            'amount.required' => 'Amount is required',
            'amount.numeric' => 'Amount must be a number',
            'amount.min' => 'Amount must be greater than or equal to 0',
            'amount.max' => 'Amount exceeds maximum limit',
            'description.max' => 'Description cannot exceed 1000 characters',
            'status.in' => 'Status must be one of: pending, approved, rejected, processing',
            'notes.max' => 'Notes cannot exceed 500 characters',
            'receipt_file.max' => 'Receipt file path cannot exceed 255 characters'
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator)
    {
        $errors = $validator->errors();
        
        // Check if the error is from BenefitBalanceRule
        if ($errors->has('amount')) {
            $amountErrors = $errors->get('amount');
            foreach ($amountErrors as $error) {
                // Check if error message is JSON (from BenefitBalanceRule)
                if ($this->isValidJson($error)) {
                    $errorData = json_decode($error, true);
                    throw new HttpResponseException(
                        response()->json($errorData, $errorData['status'] ?? 400)
                    );
                }
            }
        }

        // Default validation error response
        throw new HttpResponseException(
            response()->json([
                'status' => 400,
                'message' => 'Validation failed',
                'errors' => $errors
            ], 400)
        );
    }

    /**
     * Check if a string is valid JSON
     * 
     * @param string $string
     * @return bool
     */
    private function isValidJson($string): bool
    {
        if (!is_string($string)) {
            return false;
        }
        
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        // Ensure numeric fields are properly formatted
        if ($this->has('amount')) {
            $this->merge([
                'amount' => (float) $this->amount
            ]);
        }

        // Set default status if not provided
        if (!$this->has('status') || $this->status === null) {
            $this->merge([
                'status' => 'pending'
            ]);
        }
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'employee_id' => 'employee',
            'benefit_type_id' => 'benefit type',
            'claim_date' => 'claim date',
            'amount' => 'amount',
            'description' => 'description',
            'status' => 'status',
            'notes' => 'notes',
            'receipt_file' => 'receipt file'
        ];
    }
}