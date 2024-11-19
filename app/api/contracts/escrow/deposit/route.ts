import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const circleContractSdk = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET
});

const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

interface DepositRequest {
  circleContractId: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: DepositRequest = await req.json();

    if (!body.circleContractId) {
      return NextResponse.json(
        { error: "Missing required circleContractId" },
        { status: 400 }
      );
    }

    // Gets the escrow agreement circle_contract_id
    // This will be used to get more information about the agreement using Circle's SDK
    const { data: contractTransaction, error: contractTransactionError } = await supabase
      .from("escrow_agreements")
      .select("circle_contract_id")
      .eq("circle_contract_id", body.circleContractId)
      .single();

    if (contractTransactionError) {
      console.error("Could not find a contract with such depositor wallet ID", contractTransactionError);
      return NextResponse.json({ error: "Could not find a contract with such depositor wallet ID" });
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Gets the currently logged in user id from their auth_user_id
    // This will be used to get the user circle_wallet_id
    const { data: userId, error: userIdError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user?.id)
      .single();

    if (userIdError) {
      console.error("Could not retrieve the currently logged in user id:", userIdError);
      return NextResponse.json({ error: "Could not retrieve the currently logged in user id" }, { status: 500 })
    }

    // Gets the currently logged in user circle_wallet_id based on their user id
    // This will be used to get the escrow agreement circle_contract_id
    const { data: depositorWallet, error: depositorWalletError } = await supabase
      .from("wallets")
      .select("circle_wallet_id")
      .eq("profile_id", userId.id)
      .single();

    if (depositorWalletError) {
      console.error("Could not find a profile linked to the given wallet ID", depositorWalletError);
      return NextResponse.json({ error: "Could not find a profile linked to the given wallet ID" }, { status: 400 });
    }

    // Retrieves contract data from Circle's SDK
    const contractData = await circleContractSdk.getContract({
      id: contractTransaction.circle_contract_id
    });

    if (!contractData.data) {
      console.error("Could not retrieve contract data");
      return NextResponse.json({ error: "Could not retrieve contract data" }, { status: 500 });
    }

    const [, contractAddress] = contractData.data?.contract.name.split(" ");

    if (!contractAddress) {
      return NextResponse.json({ error: "Could not retrieve contract address" }, { status: 500 })
    }

    const response = await circleDeveloperSdk.createContractExecutionTransaction({
      walletId: depositorWallet.circle_wallet_id,
      contractAddress,
      abiFunctionSignature: "deposit()",
      abiParameters: [],
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
    });

    console.log("Funds deposit transaction created:", response.data)

    return NextResponse.json(
      {
        success: true,
        transactionId: response.data?.id,
        status: response.data?.state,
        message: "Funds deposit transaction initiated"
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error during funds deposit initialization:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate funds deposit",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
