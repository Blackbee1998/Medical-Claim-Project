<?php

namespace App\Http\Controllers;

use App\Models\BenefitTypes;
use Illuminate\Http\Request;
use App\Http\Resources\BenefitTypesResource;

class BenefitTypesController extends Controller
{
    public function index(Request $request)
    {
        // Set defaults if not provided
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $sortBy = $request->input('sort_by', 'id');
        $sortDir = $request->input('sort_dir', 'asc');
        $search = $request->input('search');
        
        try{
            $query = BenefitTypes::query();

            // Apply search filter
            if ($search) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            // Apply sorting with validation
            $allowedSortColumns = ['id', 'name', 'created_at', 'updated_at'];
            if (in_array($sortBy, $allowedSortColumns)) {
                $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
            } else {
                // Default sorting
                $query->orderBy('id', 'asc');
            }

            // Execute pagination
            $benefitTypes = $query->paginate($perPage, ['*'], 'page', $page);

            // Check if the result is empty
            if ($benefitTypes->isEmpty()) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No Benefit Types found',
                    'data' => [],
                    'pagination' => [
                        'total' => 0,
                        'per_page' => $perPage,
                        'current_page' => $page,
                        'last_page' => 0,
                        'from' => null,
                        'to' => null,
                    ],
                ], 404);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Benefit Types retrieved successfully',
                'data' => BenefitTypesResource::collection($benefitTypes),
                'pagination' => [
                    'total' => $benefitTypes->total(),
                    'per_page' => $benefitTypes->perPage(),
                    'current_page' => $benefitTypes->currentPage(),
                    'last_page' => $benefitTypes->lastPage(),
                    'from' => $benefitTypes->firstItem(),
                    'to' => $benefitTypes->lastItem(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while fetching data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try{
        $benefitType = BenefitTypes::find($id);

        if (!$benefitType) {
            return response()->json([
                'status' => 404,
                'message' => 'Benefit Type not found',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Benefit Type retrieved successfully',
            'data' => new BenefitTypesResource($benefitType),
        ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while fetching data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function store(Request $request)
    {
        try{
            $validated = $request->validate([
                'name' => 'required|string|max:50|unique:benefit_types,name',
            ]);

            $benefitType = BenefitTypes::create($validated);
            return response()->json([
                'status' => 201,
                'message' => 'Benefit Type created successfully',
                'data' => new BenefitTypesResource($benefitType)
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while creating Benefit Type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'name' => 'required|string|max:50|unique:benefit_types,name,' . $id,
            ]);
        
            $benefitType = BenefitTypes::find($id);
        
            if (!$benefitType) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Benefit Type not found',
                    'data' => null,
                ], 404);
            }
        
            $benefitType->update($validated);
        
            return response()->json([
                'status' => 200,
                'message' => 'Benefit Type updated successfully',
                'data' => new BenefitTypesResource($benefitType)
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while updating Benefit Type',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $benefitType = BenefitTypes::find($id);
    
        if (!$benefitType) {
            return response()->json([
                'status' => 404,
                'message' => 'Benefit Type not found'
            ], 404);
        }
    
        $benefitType->delete();
        return response()->json([
            'status' => 200,
            'message' => 'Benefit Type deleted successfully',
        ], 200);
    }
}
