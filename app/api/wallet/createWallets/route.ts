import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
  throw new Error(
    "Missing required environment variables: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be defined"
  );
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

export async function POST(req: NextRequest) {
  const { walletSetId } = await req.json();

  if (!walletSetId) {
    return NextResponse.json(
      { error: "walletSetId is required" },
      { status: 400 }
    );
  }

  try {
    const response = await client.createWallets({
      accountType: "SCA",
      blockchains: ["MATIC-AMOY"],
      count: 2,
      walletSetId,
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
