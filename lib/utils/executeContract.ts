import { FeeLevel } from "@circle-fin/developer-controlled-wallets";
import { circleDeveloperSdk } from "@/lib/utils/developer-controlled-wallets-client";

type ContractExecutionOptions = {
  walletId: string;
  contractAddress: string;
  abiFunctionSignature: string;
  abiParameters: (string | number | boolean)[];
  feeLevel?: FeeLevel;
};

export const executeContract = async ({
  walletId,
  contractAddress,
  abiFunctionSignature,
  abiParameters,
  feeLevel = "MEDIUM",
}: ContractExecutionOptions) => {
  try {
    const response = await circleDeveloperSdk.createContractExecutionTransaction({
      walletId,
      contractAddress,
      abiFunctionSignature,
      abiParameters,
      fee: {
        type: "level",
        config: {
          feeLevel,
        },
      },
    });

    if (!response.data?.id) {
      throw new Error("No transaction ID was returned");
    }

    return {
      transactionId: response.data.id,
      status: response.data.state,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to execute contract: ${message}`);
  }
};

// Example usage:
/*
await executeContract({
  walletId: "wallet_123",
  contractAddress: "0x1234...5678",
  abiFunctionSignature: "transfer(address,uint256)",
  abiParameters: ["0xabcd...efgh", "1000000000000000000"],
  feeLevel: "HIGH"
});
*/
