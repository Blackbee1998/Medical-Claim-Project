<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBenefitClaimRequest;
use App\Http\Requests\BenefitClaimFilterRequest;
use App\Http\Resources\BenefitClaimListResource;
use App\Http\Resources\BenefitClaimResource;
use App\Models\BenefitClaims;
use App\Services\BenefitClaimService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ClaimsHistoryExport;

class BenefitClaimController extends Controller
{
    protected $benefitClaimService;

    public function __construct(BenefitClaimService $benefitClaimService)
    {
        $this->benefitClaimService = $benefitClaimService;
    }

    public function index(BenefitClaimFilterRequest $request)
    {
        try {
            // Get filtered and paginated claims
            $claims = $this->benefitClaimService->getFilteredClaims($request);

            // Get summary data based on current filters
            $summary = $this->benefitClaimService->getSummaryData();

            return response()->json([
                'status' => 200,
                'message' => 'Benefit claims retrieved successfully',
                'data' => BenefitClaimListResource::collection($claims->items()),
                'pagination' => [
                    'total' => $claims->total(),
                    'per_page' => $claims->perPage(),
                    'current_page' => $claims->currentPage(),
                    'last_page' => $claims->lastPage(),
                    'from' => $claims->firstItem(),
                    'to' => $claims->lastItem()
                ],
                'summary' => $summary,
                
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve benefit claims',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(StoreBenefitClaimRequest $request)
    {
        try {
            // Additional validation before processing
            if (!$request->employee_id) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Employee ID is required',
                    'error' => 'Employee selection is mandatory for benefit claim creation'
                ], 400);
            }

            if (!$request->benefit_type_id) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Benefit type is required',
                    'error' => 'Benefit type selection is mandatory for benefit claim creation'
                ], 400);
            }

            if (!$request->amount || $request->amount <= 0) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Valid claim amount is required',
                    'error' => 'Claim amount must be greater than zero'
                ], 400);
            }

            // Get user ID - for testing, set default value jika tidak ada auth
            $userId = Auth::id() ?? 1; // Default ke 1 untuk testing

            // Prepare base claim data
            $claimData = [
                'employee_id' => $request->employee_id,
                'benefit_type_id' => $request->benefit_type_id,
                'claim_date' => $request->claim_date,
                'amount' => $request->amount,
                'description' => $request->description,
                'claim_number' => BenefitClaims::generateClaimNumber(), // Use proper claim number generation
                'status' => 'approved', // Auto-approve all claims by default
                'notes' => $request->notes,
                'receipt_file' => $request->receipt_file
            ];

            // Add created_by only if column exists to prevent SQL error
            if (Schema::hasColumn('benefit_claims', 'created_by')) {
                $claimData['created_by'] = $userId;
            }

            $claim = BenefitClaims::create($claimData);

            // Load relationships for response (check if createdBy relationship exists)
            $relationships = ['employee', 'benefitType'];
            if (Schema::hasColumn('benefit_claims', 'created_by')) {
                $relationships[] = 'createdBy';
            }
            
            $claim->load($relationships);

            return response()->json([
                'status' => 201,
                'message' => 'Benefit claim created successfully',
                'data' => new BenefitClaimResource($claim)
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create benefit claim',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $claim = BenefitClaims::with([
                'employee.levelEmployees',
                'employee.marriageStatuses',
                'benefitType',
                'createdBy'
            ])->findOrFail($id);

            // Get balance info
            $balanceInfo = $this->benefitClaimService->getBalanceInfo($claim);

            return response()->json([
                'status' => 200,
                'message' => 'Benefit claim retrieved successfully',
                'data' => new BenefitClaimResource($claim),
                'balance_info' => $balanceInfo
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Benefit claim not found'
            ], 404);
        }
    }

    public function update(StoreBenefitClaimRequest $request, $id)
    {
        try {
            $claim = BenefitClaims::findOrFail($id);
            
            $claim->update([
                'employee_id' => $request->employee_id,
                'benefit_type_id' => $request->benefit_type_id,
                'claim_date' => $request->claim_date,
                'amount' => $request->amount,
                'description' => $request->description,
                'status' => $request->status ?? $claim->status,
                'notes' => $request->notes,
                'receipt_file' => $request->receipt_file
            ]);

            // Load relationships for response
            $claim->load(['employee', 'benefitType', 'createdBy']);

            return response()->json([
                'status' => 200,
                'message' => 'Benefit claim updated successfully',
                'data' => new BenefitClaimResource($claim)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Benefit claim not found'
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $claim = BenefitClaims::findOrFail($id);
            $claim->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Benefit claim deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 404,
                'message' => 'Benefit claim not found'
            ], 404);
        }
    }

    public function export(BenefitClaimFilterRequest $request)
    {
        try {
            Log::info('Export request received', [
                'query_params' => $request->all(),
                'user_agent' => $request->header('User-Agent'),
                'accept' => $request->header('Accept')
            ]);
            
            // Get filtered claims query (without executing it yet)
            $query = BenefitClaims::with(['employee', 'benefitType']);
            
            // Apply the same filters as index method
            $this->benefitClaimService->applyFilters($query, $request);
            
            // Apply sorting
            $sortBy = $request->get('sort_by', 'claim_date');
            $sortDir = $request->get('sort_dir', 'desc');
            
            $allowedSortFields = ['id', 'claim_date', 'amount', 'created_at', 'updated_at'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('claim_date', 'desc');
            }
            
            // Generate filename with current date and filter info
            $filename = $this->generateExportFilename($request);
            
            // Build filter info for Excel sheet title
            $filterInfo = $this->buildFilterInfo($request);
            
            // Create and download Excel file using Laravel Excel with explicit XLSX format
            return Excel::download(
                new ClaimsHistoryExport($query, $filterInfo), 
                $filename,
                \Maatwebsite\Excel\Excel::XLSX
            );
            
        } catch (\Exception $e) {
            Log::error('Export failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 500,
                'message' => 'Failed to export claims',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    private function generateExportFilename($request)
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $filterInfo = [];
        
        // Add filter information to filename
        if ($request->filled('employee_id')) {
            $employee = \App\Models\Employees::find($request->employee_id);
            if ($employee) {
                $filterInfo[] = 'Employee-' . str_replace(' ', '', $employee->name);
            }
        }
        
        if ($request->filled('benefit_type_id')) {
            $benefitType = \App\Models\BenefitTypes::find($request->benefit_type_id);
            if ($benefitType) {
                $filterInfo[] = 'Type-' . ucfirst($benefitType->name);
            }
        }
        
        if ($request->filled('status')) {
            $filterInfo[] = 'Status-' . ucfirst($request->status);
        }
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $filterInfo[] = 'Period-' . $request->start_date . '_to_' . $request->end_date;
        } elseif ($request->filled('start_date')) {
            $filterInfo[] = 'From-' . $request->start_date;
        } elseif ($request->filled('end_date')) {
            $filterInfo[] = 'Until-' . $request->end_date;
        }
        
        if ($request->filled('search')) {
            $filterInfo[] = 'Search-' . str_replace(' ', '', $request->search);
        }
        
        $filterString = empty($filterInfo) ? 'All-Data' : implode('_', $filterInfo);
        
        return "Claims-History_{$filterString}_{$timestamp}.xlsx";
    }
    
    private function buildFilterInfo($request)
    {
        $filterInfo = [];
        
        // Add filter information for sheet title
        if ($request->filled('employee_id')) {
            $employee = \App\Models\Employees::find($request->employee_id);
            if ($employee) {
                $filterInfo[] = 'Employee: ' . $employee->name;
            }
        }
        
        if ($request->filled('benefit_type_id')) {
            $benefitType = \App\Models\BenefitTypes::find($request->benefit_type_id);
            if ($benefitType) {
                $filterInfo[] = 'Type: ' . ucfirst($benefitType->name);
            }
        }
        
        if ($request->filled('status')) {
            $filterInfo[] = 'Status: ' . ucfirst($request->status);
        }
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $filterInfo[] = 'Period: ' . $request->start_date . ' to ' . $request->end_date;
        } elseif ($request->filled('start_date')) {
            $filterInfo[] = 'From: ' . $request->start_date;
        } elseif ($request->filled('end_date')) {
            $filterInfo[] = 'Until: ' . $request->end_date;
        }
        
        if ($request->filled('search')) {
            $filterInfo[] = 'Search: ' . $request->search;
        }
        
        return $filterInfo;
    }
    



}