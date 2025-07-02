<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LevelEmployees;
use App\Http\Resources\LevelEmployeeResource;

class LevelEmployeeController extends Controller
{
    public function index(Request $request)
    {
        // Set defaults if not provided
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $sortBy = $request->input('sort_by', 'id');
        $sortDir = $request->input('sort_dir', 'asc');
        $search = $request->input('search');
    
        try {
            $query = LevelEmployees::query();
            
            // Apply search if provided
            if ($search) {
                $searchTerm = strtolower($search);
                $query->whereRaw('LOWER(name) LIKE ?', ["%{$searchTerm}%"]);
            }
            
            // Apply sorting
            $query->orderBy($sortBy, $sortDir);
            
            // Execute pagination
            $levelEmployees = $query->paginate($perPage, ['*'], 'page', $page);

            // Check if the result is empty
            if ($levelEmployees->isEmpty()) {
                return response()->json([
                    'status' => 404,
                    'message' => 'No Level Employees found',
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
                'message' => 'Level Employees retrieved successfully',
                'data' => LevelEmployeeResource::collection($levelEmployees),
                'pagination' => [
                    'total' => $levelEmployees->total(),
                    'per_page' => $levelEmployees->perPage(),
                    'current_page' => $levelEmployees->currentPage(),
                    'last_page' => $levelEmployees->lastPage(),
                    'from' => $levelEmployees->firstItem(),
                    'to' => $levelEmployees->lastItem(),
                ],
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'status'=> 500,
                'message' => 'An error occurred while fetching Level Employees',
                'error' => 'An error occurred while fetching data: ' . $e->getMessage(),
            ], 500);
        }
    }


    public function show($id)
    {
        try {
        $levelEmployee = LevelEmployees::find($id);

        if (!$levelEmployee) {
            return response()->json([
                'status' => 404,
                'message' => 'Level Employee not found',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Level Employee retrieved successfully',
            'data' => new LevelEmployeeResource($levelEmployee),
        ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while fetching Level Employee',
                'error' => 'An error occurred while fetching data: ' . $e->getMessage(),
            ], 500);
        }
    }


    public function store(Request $request)
    {
        try{
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:level_employees,name',
            ]);

            $levelEmployee = LevelEmployees::create($validated);

            return response()->json([
                'status' => 201,
                'message' => 'Level Employee created successfully',
                'data' => new LevelEmployeeResource($levelEmployee)
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
                'message' => 'Failed to create Level Employee',
                'error' => 'An error occurred while creating Level Employee: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:level_employees,name,' . $id,
            ]);
        
            $levelEmployee = LevelEmployees::find($id);
        
            if (!$levelEmployee) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Level Employee not found',
                    'data' => null,
                ], 404);
            }
        
            $levelEmployee->update($validated);
    
            return response()->json([
                'status' => 200,
                'message' => 'Level Employee updated successfully',
                'data' => new LevelEmployeeResource($levelEmployee)
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
                'message' => 'Failed to update Level Employee',
                'error' => 'An error occurred while updating Level Employee: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $levelEmployee = LevelEmployees::find($id);
        
            if (!$levelEmployee) {
                return response()->json([
                    'status' => 404,
                    'message' => 'Level Employee not found'
                ], 404);
            }
        
            $levelEmployee->delete(); // This will be soft delete due to SoftDeletes trait
            
            return response()->json([
                'status' => 200,
                'message' => 'Level Employee deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete Level Employee',
                'error' => 'An error occurred while deleting Level Employee: ' . $e->getMessage(),
            ], 500);
        }
    }
}
