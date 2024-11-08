import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { ABIJSON, CONTRACT_BYTECODE } from "@/lib/constants";

// Environment variable validation
const requiredEnvVars = [
  "CIRCLE_API_KEY",
  "CIRCLE_ENTITY_SECRET",
  "USDC_CONTRACT_ADDRESS",  
] as const;

// Type for environment variables
interface EnvVariables {
  CIRCLE_API_KEY: string;
  CIRCLE_ENTITY_SECRET: string;
  USDC_CONTRACT_ADDRESS: string;  
}

// Validate and get environment variables
function getEnvVariables(): EnvVariables {
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    CIRCLE_API_KEY: process.env.CIRCLE_API_KEY!,
    CIRCLE_ENTITY_SECRET: process.env.CIRCLE_ENTITY_SECRET!,
    USDC_CONTRACT_ADDRESS: process.env.USDC_CONTRACT_ADDRESS!,    
  };
}

// Get environment variables
const env = getEnvVariables();

// Initialize Circle client
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: env.CIRCLE_API_KEY,
  entitySecret: env.CIRCLE_ENTITY_SECRET,
});
// Initialize Circle Smart Contract client
const circleContractClient = initiateSmartContractPlatformClient({
  apiKey: env.CIRCLE_API_KEY,
  entitySecret: env.CIRCLE_ENTITY_SECRET,
});

function convertUSDCToContractAmount(amount: number): string {
  return (amount * 1000000).toString();
}

interface CreateEscrowRequest {
  depositorAddress: string;
  beneficiaryAddress: string;
  agentAddress: string;
  agentWalletId: string;
  amountUSDC: number;
}

async function waitForTransactionStatus(id: string) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const response = await circleClient.getTransaction({ id });

      if (!response.data) {
        throw new Error("No data returned from transaction status check");
      }

      console.log("Transaction status response:", response.data);

      const status = response.data.transaction?.state;
      if (status === "COMPLETE") return response.data;
      if (status === "FAILED") {
        throw new Error(
          `Transaction failed: ${response.data.transaction?.errorReason || "Unknown error"}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    } catch (error: any) {
      console.error("Error checking transaction status:", error);
      if (error.response?.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Transaction status check timeout");
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateEscrowRequest = await req.json();

    // Validate request
    if (
      !body.depositorAddress ||
      !body.beneficiaryAddress ||
      !body.agentAddress ||
      !body.agentWalletId ||
      !body.amountUSDC
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate Ethereum addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (
      !addressRegex.test(body.depositorAddress) ||
      !addressRegex.test(body.beneficiaryAddress) ||
      !addressRegex.test(body.agentAddress)
    ) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    // Convert USDC amount to contract format
    const contractAmount = convertUSDCToContractAmount(body.amountUSDC);

    // Create contract execution transaction
    const createResponse = await circleContractClient.deployContract({
      walletId: body.agentWalletId,
      name: `Escrow ${body.beneficiaryAddress}`,
      bytecode: CONTRACT_BYTECODE,
      blockchain: "MATIC-AMOY",
      constructorParameters: [
        body.depositorAddress,
        body.beneficiaryAddress,
        body.agentAddress,
        contractAmount,
        env.USDC_CONTRACT_ADDRESS,
      ],
      abiJson: ABIJSON,
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
    });

    if (!createResponse.data) {
      throw new Error("No data returned from transaction creation");
    }

    console.log("Transaction created:", createResponse.data);

    return NextResponse.json(
      {
        success: true,
        id: createResponse.data.contractId,
        transactionId: createResponse.data.transactionId,
        status: "PENDING",
        message: "Escrow contract creation initiated",
        addresses: {
          depositor: body.depositorAddress,
          beneficiary: body.beneficiaryAddress,
          agent: body.agentAddress,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating escrow:", error);
    return NextResponse.json(
      {
        error: "Failed to create escrow contract",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const transactionStatus = await waitForTransactionStatus(id);

    return NextResponse.json(
      {
        success: true,
        status: transactionStatus.transaction?.state,
        transaction: transactionStatus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking transaction status:", error);
    return NextResponse.json(
      {
        error: "Failed to get transaction status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
