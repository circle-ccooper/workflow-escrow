"use client";

import { type SmartContractResponse, useSmartContract } from "@/app/hooks/useSmartContract";
import { Button } from "@/components/ui/button";
import { SYSTEM_AGENT_ADDRESS, SYSTEM_AGENT_WALLET_ID } from "@/lib/constants";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";

interface CreateSmartContractButtonProps {
  depositorAddress: string;
  beneficiaryAddress: string;
  amountUSDC: number | undefined;
  onSuccess?: (response: SmartContractResponse) => void;
  disabled?: boolean;
}

export const CreateSmartContractButton = ({
  depositorAddress,
  beneficiaryAddress,
  amountUSDC,
  onSuccess,
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

    if (!amountUSDC) {
      toast.error("Invalid amount for the contract", {
        description:
          "Amount for the contract should be greater than 0",
      });
      return;
    }

    try {
      const response = await createSmartContract({
        depositorAddress,
        beneficiaryAddress,
        agentAddress: SYSTEM_AGENT_ADDRESS,
        agentWalletId: SYSTEM_AGENT_WALLET_ID,
        amountUSDC,
      });

      toast.success("Smart contract created", {
        description: "Your smart contract is being processed",
      });

      onSuccess?.(response);
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
