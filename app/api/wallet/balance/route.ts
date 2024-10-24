import { type NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET
});

export async function POST(req: NextRequest) {
  try {
    const { walletId } = await req.json();

    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 });
    }

    const response = await client.getWalletTokenBalance({
      id: walletId
    });

    const balance = response.data?.tokenBalances?.find(({ token }) => token.name === "USDC")?.amount;

    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error("Error fetching balance from wallet:", error.message || "An unknown error occurred");
    return NextResponse.json({ error: "An error fetching balance from wallet" }, { status: 500 });
  }
}
