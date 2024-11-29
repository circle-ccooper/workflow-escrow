import type { Blockchain } from "@circle-fin/smart-contract-platform";
import { NextRequest, NextResponse } from "next/server";
import { circleDeveloperSdk } from "@/lib/utils/developer-controlled-wallets-client";

export async function POST(req: NextRequest) {
  try {
    const { walletSetId } = await req.json();

    if (!walletSetId) {
      return NextResponse.json(
        { error: "walletSetId is required" },
        { status: 400 }
      );
    }

    if (!process.env.CIRCLE_BLOCKCHAIN) {
      throw new Error("CIRCLE_BLOCKCHAIN environment variable is not set");
    }

    const response = await circleDeveloperSdk.createWallets({
      accountType: "SCA",
      blockchains: [process.env.CIRCLE_BLOCKCHAIN as Blockchain],
      count: 1,
      walletSetId,
    });

    if (!response.data?.wallets?.length) {
      return NextResponse.json(
        { error: "No wallets were created" },
        { status: 500 }
      );
    }

    const [createdWallet] = response.data.wallets;

    return NextResponse.json(createdWallet, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create wallet: ${message}` },
      { status: 500 }
    );
  }
}
