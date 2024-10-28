import { NextRequest, NextResponse } from "next/server";
import { circleClient } from "@/utils/circleClient";

const client = circleClient();

export async function PUT(req: NextRequest) {
  try {
    const { walletSetId } = await req.json();

    if (!walletSetId) {
      return NextResponse.json(
        { error: "walletSetId is required" },
        { status: 400 }
      );
    }

    const response = await client.createWallets({
      accountType: "SCA",
      blockchains: ["MATIC-AMOY"],
      count: 1,
      walletSetId
    });

    if (!response.data?.wallets?.length) {
      throw new Error("No wallets were created");
    }

    const [createdWallet] = response.data.wallets;

    return NextResponse.json(createdWallet, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create wallet: ${message}`);
  }
}
