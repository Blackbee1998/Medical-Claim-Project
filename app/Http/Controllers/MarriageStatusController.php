<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\MarriageStatuses;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Resources\Json\ResourceCollection;
use App\Http\Resources\MarriageStatusResource;
use Illuminate\Http\Resources\Json\JsonResource;

class MarriageStatusController extends Controller
{
    /**
     * Display a listing of the marriage statuses with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Extract and validate pagination and sorting parameters
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);
            $sortBy = $this->validateSortField($request->input('sort_by', 'id'));
            $sortDir = in_array(strtolower($request->input('sort_dir', 'asc')), ['asc', 'desc']) 
                ? strtolower($request->input('sort_dir', 'asc')) 
                : 'asc';
            
            // Extract search parameter
            $search = $request->input('search');

            // Build the query
            $query = MarriageStatuses::query();
            
            // Apply search if provided
            if ($search) {
                $searchTerm = strtolower($search);
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereRaw('LOWER(code) LIKE ?', ["%{$searchTerm}%"])
                      ->orWhereRaw('LOWER(description) LIKE ?', ["%{$searchTerm}%"]);
                });
            }
            
            $query->orderBy($sortBy, $sortDir);

            // Execute the query with pagination
            $marriageStatuses = $query->paginate($perPage, ['*'], 'page', $page);

            // Handle empty results case
            if ($marriageStatuses->isEmpty()) {
                return $this->emptyResponse($perPage, $page);
            }

            // Return successful response
            return $this->successResponse(
                'Marriage statuses retrieved successfully',
                MarriageStatusResource::collection($marriageStatuses),
                $this->getPaginationData($marriageStatuses)
            );
        } catch (Exception $e) {
            Log::error('Error fetching marriage statuses: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return $this->errorResponse('An error occurred while fetching data: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified marriage status.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $marriageStatus = MarriageStatuses::find($id);

            // Guard clause: Return early if not found
            if (!$marriageStatus) {
                return $this->notFoundResponse('Marriage Status not found');
            }

            return $this->successResponse(
                'Marriage Status retrieved successfully',
                new MarriageStatusResource($marriageStatus)
            );
        } catch (Exception $e) {
            Log::error('Error fetching marriage status: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'id' => $id
            ]);
            
            return $this->errorResponse('An error occurred while fetching data: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created marriage status.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request data
            $validated = $request->validate([
                'code' => 'required|string|max:10|unique:marriage_statuses,code',
                'description' => 'required|string|max:255',
            ]);

            // Create a new marriage status
            $marriageStatus = MarriageStatuses::create($validated);
            
            return $this->createdResponse(
                'Marriage Status created successfully',
                new MarriageStatusResource($marriageStatus)
            );
        } catch (Exception $e) {
            Log::error('Error creating marriage status: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return $this->errorResponse('An error occurred while creating data: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified marriage status.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            // Validate the request data
            $validated = $request->validate([
                'code' => "required|string|max:10|unique:marriage_statuses,code,{$id}",
                'description' => 'required|string|max:255',
            ]);
        
            $marriageStatus = MarriageStatuses::find($id);
        
            // Guard clause: Return early if not found
            if (!$marriageStatus) {
                return $this->notFoundResponse('Marriage Status not found');
            }
        
            $marriageStatus->update($validated);
        
            return $this->successResponse(
                'Marriage Status updated successfully',
                new MarriageStatusResource($marriageStatus)
            );
        } catch (Exception $e) {
            Log::error('Error updating marriage status: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'id' => $id,
                'request' => $request->all()
            ]);
            
            return $this->errorResponse('An error occurred while updating data: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified marriage status.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $marriageStatus = MarriageStatuses::find($id);

            // Guard clause: Return early if not found
            if (!$marriageStatus) {
                return $this->notFoundResponse('Marriage status not found');
            }

            $marriageStatus->delete();
            
            return $this->successResponse('Marriage Status deleted successfully');
        } catch (Exception $e) {
            Log::error('Error deleting marriage status: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'id' => $id
            ]);
            
            return $this->errorResponse('An error occurred while deleting data: ' . $e->getMessage());
        }
    }

    /**
     * Validates the sort field to prevent SQL injection.
     *
     * @param string $field
     * @return string
     */
    private function validateSortField(string $field): string
    {
        $allowedFields = ['id', 'code', 'description', 'created_at', 'updated_at'];
        
        return in_array($field, $allowedFields) ? $field : 'id';
    }

    /**
     * Returns pagination data from a paginator.
     *
     * @param \Illuminate\Pagination\LengthAwarePaginator $paginator
     * @return array
     */
    private function getPaginationData($paginator): array
    {
        return [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }

    /**
     * Returns a success response.
     *
     * @param string $message
     * @param mixed $data
     * @param array|null $pagination
     * @param int $status
     * @return JsonResponse
     */
    private function successResponse(string $message, $data = null, ?array $pagination = null, int $status = 200): JsonResponse
    {
        $response = [
            'status' => $status,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if ($pagination !== null) {
            $response['pagination'] = $pagination;
        }

        return response()->json($response, $status);
    }

    /**
     * Returns a created response (201).
     *
     * @param string $message
     * @param mixed $data
     * @return JsonResponse
     */
    private function createdResponse(string $message, $data = null): JsonResponse
    {
        return $this->successResponse($message, $data, null, 201);
    }

    /**
     * Returns a not found response (404).
     *
     * @param string $message
     * @return JsonResponse
     */
    private function notFoundResponse(string $message): JsonResponse
    {
        return response()->json([
            'status' => 404,
            'message' => $message,
            'data' => null,
        ], 404);
    }

    /**
     * Returns an error response (500).
     *
     * @param string $message
     * @return JsonResponse
     */
    private function errorResponse(string $message): JsonResponse
    {
        return response()->json([
            'status' => 500,
            'message' => 'An error occurred while processing your request',
            'error' => $message
        ], 500);
    }

    /**
     * Returns an empty response when no records are found.
     *
     * @param int $perPage
     * @param int $page
     * @return JsonResponse
     */
    private function emptyResponse(int $perPage, int $page): JsonResponse
    {
        return response()->json([
            'status' => 404,
            'message' => 'No Marriage Statuses found',
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
}
