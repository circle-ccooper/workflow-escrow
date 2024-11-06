import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { Interface } from "@ethersproject/abi";

// Constants
const USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; // Polygon PoS Amoy
const ESCROW_FACTORY_ADDRESS = "0xc8aFDC71eF9eF45B6Cb608390Cc57C10d4fE05E9";

// ABI fragment for the EscrowCreated event
const ESCROW_FACTORY_ABI = [
  "event EscrowCreated(uint256 escrowId, address escrowAddress, address depositor, address beneficiary, address agent, uint256 amount)",
];

const escrowInterface = new Interface(ESCROW_FACTORY_ABI);

// Initialize Circle client
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

function convertUSDCToContractAmount(amount: number): string {
  return (amount * 1000000).toString();
}

interface CreateEscrowRequest {
  depositorWalletId: string;
  beneficiaryWalletId: string;
  agentWalletId: string;
  amountUSDC: number;
}

// Helper function to get wallet address from wallet ID
async function getWalletAddress(walletId: string): Promise<string> {
  try {
    const response = await circleClient.getWallet({ id: walletId });
    if (!response.data?.wallet?.address) {
      throw new Error(`No address found for wallet ID: ${walletId}`);
    }
    return response.data.wallet.address;
  } catch (error) {
    console.error(`Error getting wallet address for ID ${walletId}:`, error);
    throw error;
  }
}

// Helper function to wait for transaction status
async function waitForTransactionStatus(id: string) {
  let attempts = 0;
  const maxAttempts = 130; // 130 seconds timeout

  while (attempts < maxAttempts) {
    try {
      const response = await circleClient.getTransaction({
        id: id,
      });

      if (!response.data) {
        throw new Error("No data returned from transaction status check");
      }

      console.log("Transaction status response:", response.data);

      const status = response.data.transaction?.state;
      if (status === "COMPLETE") {
        return response.data;
      }

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
      !body.depositorWalletId ||
      !body.beneficiaryWalletId ||
      !body.agentWalletId ||
      !body.amountUSDC
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get Ethereum addresses for all wallets
    console.log('Resolving wallet addresses...');
    const [depositorAddress, beneficiaryAddress, agentAddress] = await Promise.all([
      getWalletAddress(body.depositorWalletId),
      getWalletAddress(body.beneficiaryWalletId),
      getWalletAddress(body.agentWalletId)
    ]);

    console.log('Resolved addresses:', {
      depositor: depositorAddress,
      beneficiary: beneficiaryAddress,
      agent: agentAddress
    });

    // Convert USDC amount to contract format
    const contractAmount = convertUSDCToContractAmount(body.amountUSDC);

    // Create contract execution transaction
    const createResponse = await circleClient.createContractExecutionTransaction({
      walletId: body.agentWalletId,
      contractAddress: ESCROW_FACTORY_ADDRESS,
      abiFunctionSignature: "createEscrow(address,address,address,uint256,address)",
      abiParameters: [
        depositorAddress,
        beneficiaryAddress,
        agentAddress,
        contractAmount,
        USDC_CONTRACT_ADDRESS,
      ],
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
        id: createResponse.data.id,
        status: "PENDING",
        message: "Escrow contract creation initiated",
        addresses: {
          depositor: depositorAddress,
          beneficiary: beneficiaryAddress,
          agent: agentAddress
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating escrow:", error);

    const errorResponse = {
      error: "Failed to create escrow contract",
      details: error.response?.data || error.message,
    };

    return NextResponse.json(errorResponse, { status: 500 });
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