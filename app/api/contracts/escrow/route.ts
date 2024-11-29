import type { Blockchain } from "@circle-fin/smart-contract-platform";
import { NextRequest, NextResponse } from "next/server";
import { circleContractSdk } from "@/lib/utils/smart-contract-platform-client";
import { ABIJSON, CONTRACT_BYTECODE } from "@/lib/constants";
import { circleDeveloperSdk } from "@/lib/utils/developer-controlled-wallets-client";
import { convertUSDCToContractAmount } from "@/lib/utils/amount";

interface CreateEscrowRequest {
  depositorAddress: string;
  beneficiaryAddress: string;
  agentAddress: string;
  amountUSDC: number;
}

async function waitForTransactionStatus(id: string) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const response = await circleDeveloperSdk.getTransaction({ id });

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
    const contractAmount = Number(convertUSDCToContractAmount(body.amountUSDC));

    if (!process.env.CIRCLE_BLOCKCHAIN) {
      throw new Error("CIRCLE_BLOCKCHAIN environment variable is not set");
    }

    // Create contract execution transaction
    const createResponse = await circleContractSdk.deployContract({
      name: `Escrow ${body.beneficiaryAddress}`,
      description: `Escrow ${body.beneficiaryAddress}`,
      walletId: process.env.NEXT_PUBLIC_AGENT_WALLET_ID,
      blockchain: process.env.CIRCLE_BLOCKCHAIN as Blockchain,
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
      constructorParameters: [
        body.depositorAddress,
        body.beneficiaryAddress,
        process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS,
        contractAmount,
        process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
      ],
      abiJson: ABIJSON,
      bytecode: CONTRACT_BYTECODE,
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
