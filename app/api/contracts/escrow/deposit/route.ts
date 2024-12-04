import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { circleContractSdk } from "@/lib/utils/smart-contract-platform-client";
import { circleDeveloperSdk } from "@/lib/utils/developer-controlled-wallets-client";

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
      .select()
      .eq("circle_contract_id", body.circleContractId)
      .single();

    if (contractTransactionError) {
      console.error("Could not find a contract with such depositor wallet ID", contractTransactionError);
      return NextResponse.json({ error: "Could not find a contract with such depositor wallet ID" });
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User is not authenticated");
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Could not find a profile linked to the given wallet ID" }, { status: 500 });
    }

    // Retrieves contract data from Circle's SDK
    const contractData = await circleContractSdk.getContract({
      id: contractTransaction.circle_contract_id
    });

    if (!contractData.data) {
      console.error("Could not retrieve contract data");
      return NextResponse.json({ error: "Could not retrieve contract data" }, { status: 500 });
    }

    const contractAddress = contractData.data?.contract.contractAddress;

    if (!contractAddress) {
      return NextResponse.json({ error: "Could not retrieve contract address" }, { status: 500 })
    }

    const circleDepositResponse = await circleDeveloperSdk.createContractExecutionTransaction({
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

    console.log("Funds deposit transaction created:", circleDepositResponse.data);

    await supabase
      .from("escrow_agreements")
      .update({ status: "PENDING" })
      .eq("circle_contract_id", contractTransaction.circle_contract_id);

    return NextResponse.json(
      {
        success: true,
        transactionId: circleDepositResponse.data?.id,
        status: circleDepositResponse.data?.state,
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
