import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

// Constants
const USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; // Polygon PoS Amoy
const ESCROW_FACTORY_ADDRESS = "0xc8aFDC71eF9eF45B6Cb608390Cc57C10d4fE05E9";

// Initialize Circle client
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!
});

// Helper function to convert USDC amount to contract format
function convertUSDCToContractAmount(amount: number): string {
  return (amount * 1000000).toString(); // 1 USDC = 1000000 units
}

interface CreateEscrowRequest {
  depositorWalletId: string;    // Payer's wallet ID
  beneficiaryWalletId: string;  // Payee's wallet ID
  agentWalletId: string;        // Agent's wallet ID
  amountUSDC: number;           // Amount in USDC
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateEscrowRequest = await req.json();
    
    // Validate request
    if (!body.depositorWalletId || !body.beneficiaryWalletId || 
        !body.agentWalletId || !body.amountUSDC) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert USDC amount to contract format
    const contractAmount = convertUSDCToContractAmount(body.amountUSDC);

    // Create contract execution transaction
    const response = await circleClient.createContractExecutionTransaction({
      walletId: body.agentWalletId, // Using agent wallet to deploy
      contractAddress: ESCROW_FACTORY_ADDRESS,
      abiFunctionSignature: "createEscrow(address,address,address,uint256,address)",
      abiParameters: [
        body.depositorWalletId,    
        body.beneficiaryWalletId,  
        body.agentWalletId,        
        contractAmount,            
        USDC_CONTRACT_ADDRESS      
      ],
      fee: {
        type: "level",
        config: {
          feeLevel: "HIGH"
        }
      }
    });    
    
    return NextResponse.json({
      transactionId: response.data?.id,
      status: response.data?.state,
      things: response.statusText,
      message: "Escrow contract creation initiated"
    }, { status: 201 });

  } catch (error: any) {
    console.error(`Failed to create escrow contract: ${error}`);
    return NextResponse.json(
      { error: "Failed to create escrow contract" },
      { status: 500 }
    );
  }
}

// Helper function to get escrow contract status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const escrowId = searchParams.get('escrowId');
    const contractAddress = searchParams.get('contractAddress');

    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address is required" },
        { status: 400 }
      );
    }

    // Call the getEscrowById function if escrowId is provided
    if (escrowId) {
      const response = await circleClient.createContractExecutionTransaction({
        walletId: process.env.AGENT_WALLET_ID!, // Using agent wallet to query
        contractAddress: ESCROW_FACTORY_ADDRESS,
        abiFunctionSignature: "getEscrowById(uint256)",
        abiParameters: [escrowId],
        fee: {
          type: "level",
          config: {
            feeLevel: "HIGH"
          }
        }
      });

      return NextResponse.json(response.data, { status: 200 });
    }

    // Get contract balance and stage
    const balanceResponse = await circleClient.createContractExecutionTransaction({
      walletId: process.env.AGENT_WALLET_ID!,
      contractAddress,
      abiFunctionSignature: "balanceOf()",
      abiParameters: [],
      fee: {
        type: "level",
        config: {
          feeLevel: "HIGH"
        }
      }
    });

    const stageResponse = await circleClient.createContractExecutionTransaction({
      walletId: process.env.AGENT_WALLET_ID!,
      contractAddress,
      abiFunctionSignature: "stageOf()",
      abiParameters: [],
      fee: {
        type: "level",
        config: {
          feeLevel: "HIGH"
        }
      }
    });

    return NextResponse.json({
      balance: balanceResponse.data,
      stage: stageResponse.data
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Failed to get escrow status: ${error.message}`);
    return NextResponse.json(
      { error: "Failed to get escrow status" },
      { status: 500 }
    );
  }
}