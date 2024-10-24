import { type NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { z } from "zod";

const WalletIdSchema = z.object({
  walletId: z.string().uuid()
});

if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
  throw new Error(
    "Missing required environment variables: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be defined"
  );
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = WalletIdSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid walletId format" }, { status: 400 });
    }

    const { walletId } = parseResult.data;

    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 });
    }

    const response = await client.getWalletTokenBalance({
      id: walletId
    });

    const balance = response.data?.tokenBalances?.find(({ token }) => token.name === "USDC")?.amount;

    if (balance === undefined) {
      return NextResponse.json({ error: "USDC balance not found" }, { status: 404 });
    }

    return NextResponse.json({ balance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    console.error("Error fetching balance from wallet:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error while fetching balance" },
      { status: 500 }
    );
  }
}
