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
      return NextResponse.json({ error: "No wallets were created" }, { status: 500 });
    }

    const [createdWallet] = response.data.wallets;

    return NextResponse.json(createdWallet, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create wallet: ${message}` }, { status: 500 });
  }
}
