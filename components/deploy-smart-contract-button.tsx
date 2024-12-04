"use client";

import type { EscrowAgreementWithDetails } from "@/types/escrow";
import { type SmartContractResponse, useSmartContract } from "@/app/hooks/useSmartContract";
import { Button } from "@/components/ui/button";
import { SYSTEM_AGENT_ADDRESS, SYSTEM_AGENT_WALLET_ID } from "@/lib/constants";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";

interface CreateSmartContractButtonProps {
  agreement: EscrowAgreementWithDetails
  disabled?: boolean;
}

export const CreateSmartContractButton = ({
  agreement,
  disabled,
}: CreateSmartContractButtonProps) => {
  const { createSmartContract, isLoading } = useSmartContract();

  const handleCreateSmartContract = async () => {
    if (!SYSTEM_AGENT_ADDRESS || !SYSTEM_AGENT_WALLET_ID) {
      toast.error("Configuration Error", {
        description:
          "System is not properly configured. Please check your environment variables.",
      });
      return;
    }

    const amountUSDC = agreement.terms.amounts && agreement.terms.amounts.length > 0
      ? parseFloat(agreement.terms.amounts[0]?.amount.replace(/[$,]/g, ""))
      : undefined;

    if (!amountUSDC) {
      toast.error("Invalid amount for the contract", {
        description:
          "Amount for the contract should be greater than 0",
      });
      return;
    }

    try {
      await createSmartContract({
        agreement,
        agentAddress: SYSTEM_AGENT_ADDRESS,
        agentWalletId: SYSTEM_AGENT_WALLET_ID,
        amountUSDC,
      });
    } catch (error) {
      toast.error("Failed to create smart contract", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  return (
    <Button
      onClick={handleCreateSmartContract}
      disabled={
        isLoading ||
        disabled ||
        !SYSTEM_AGENT_ADDRESS ||
        !SYSTEM_AGENT_WALLET_ID
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <WalletCards className="mr-2 h-4 w-4" />
          Create Smart Contract
        </>
      )}
    </Button>
  );
};
