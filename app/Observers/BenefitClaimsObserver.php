<?php

namespace App\Observers;

use App\Models\BenefitClaims;
use App\Services\BalanceManagementService;
use Illuminate\Support\Facades\Log;

class BenefitClaimsObserver
{
    protected $balanceService;

    public function __construct(BalanceManagementService $balanceService)
    {
        $this->balanceService = $balanceService;
    }

    /**
     * Handle the BenefitClaims "created" event.
     */
    public function created(BenefitClaims $claim): void
    {
        try {
            // Only process approved claims for balance updates
            if ($claim->status === 'approved') {
                $this->balanceService->processClaimBalanceUpdate($claim, 'created');
                Log::info("Balance updated for created approved claim", [
                    'claim_id' => $claim->id,
                    'status' => $claim->status,
                    'amount' => $claim->amount
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to update balance for created claim: " . $e->getMessage(), [
                'claim_id' => $claim->id,
                'employee_id' => $claim->employee_id,
                'amount' => $claim->amount,
                'status' => $claim->status,
            ]);
        }
    }

    /**
     * Handle the BenefitClaims "updating" event.
     */
    public function updating(BenefitClaims $claim): void
    {
        // Store the old amount and status for comparison
        $claim->_old_amount = $claim->getOriginal('amount');
        $claim->_old_status = $claim->getOriginal('status');
    }

    /**
     * Handle the BenefitClaims "updated" event.
     */
    public function updated(BenefitClaims $claim): void
    {
        try {
            $oldStatus = $claim->_old_status ?? $claim->getOriginal('status');
            $oldAmount = $claim->_old_amount ?? $claim->getOriginal('amount');
            $newStatus = $claim->status;
            $newAmount = $claim->amount;

            // Handle status changes
            if ($oldStatus !== $newStatus) {
                // If status changed from not approved to approved
                if ($oldStatus !== 'approved' && $newStatus === 'approved') {
                    $this->balanceService->processClaimBalanceUpdate($claim, 'created');
                    Log::info("Balance deducted for approved claim", ['claim_id' => $claim->id]);
                }
                // If status changed from approved to not approved
                elseif ($oldStatus === 'approved' && $newStatus !== 'approved') {
                    // Create a temporary claim with old amount to restore balance
                    $tempClaim = clone $claim;
                    $tempClaim->amount = $oldAmount;
                    $tempClaim->status = 'approved'; // Set to approved for processing
                    $this->balanceService->processClaimBalanceUpdate($tempClaim, 'deleted');
                    Log::info("Balance restored for disapproved claim", ['claim_id' => $claim->id]);
                }
            }
            // If status is approved and amount changed
            elseif ($newStatus === 'approved' && $oldAmount != $newAmount) {
                $this->balanceService->processClaimBalanceUpdate($claim, 'updated', $oldAmount);
                Log::info("Balance updated for amount change", ['claim_id' => $claim->id, 'old_amount' => $oldAmount, 'new_amount' => $newAmount]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to update balance for updated claim: " . $e->getMessage(), [
                'claim_id' => $claim->id,
                'employee_id' => $claim->employee_id,
                'old_amount' => $oldAmount ?? null,
                'new_amount' => $claim->amount,
                'old_status' => $oldStatus ?? null,
                'new_status' => $claim->status,
            ]);
        }
    }

    /**
     * Handle the BenefitClaims "deleted" event.
     */
    public function deleted(BenefitClaims $claim): void
    {
        try {
            if ($claim->status === 'approved') {
                $this->balanceService->processClaimBalanceUpdate($claim, 'deleted');
                Log::info("Balance restored for deleted claim", ['claim_id' => $claim->id]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to restore balance for deleted claim: " . $e->getMessage(), [
                'claim_id' => $claim->id,
                'employee_id' => $claim->employee_id,
                'amount' => $claim->amount,
            ]);
        }
    }

    /**
     * Handle the BenefitClaims "force deleted" event.
     */
    public function forceDeleted(BenefitClaims $claim): void
    {
        try {
            if ($claim->status === 'approved') {
                $this->balanceService->processClaimBalanceUpdate($claim, 'deleted');
                Log::info("Balance restored for force deleted claim", ['claim_id' => $claim->id]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to restore balance for force deleted claim: " . $e->getMessage(), [
                'claim_id' => $claim->id,
                'employee_id' => $claim->employee_id,
                'amount' => $claim->amount,
            ]);
        }
    }
}