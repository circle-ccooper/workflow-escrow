import { type NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { z } from "zod";

const WalletIdSchema = z.object({
  walletId: z.string().uuid(),
});

const ResponseSchema = z.object({
  transactions: z
    .array(
      z.object({
        id: z.string(),
        amount: z.string(),
        status: z.string(),
        createDate: z.string(),
      })
    )
    .optional(),
  error: z.string().optional(),
});

type WalletTransactionsResponse = z.infer<typeof ResponseSchema>;

if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
  throw new Error(
    "Missing required environment variables: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be defined"
  );
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

export async function POST(
  req: NextRequest
): Promise<NextResponse<WalletTransactionsResponse>> {
  try {
    const body = await req.json();
    const parseResult = WalletIdSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid walletId format" },
        { status: 400 }
      );
    }

    const { walletId } = parseResult.data;

    const response = await client.listTransactions({
      walletIds: [walletId],
      includeAll: true,
    });

    if (
      !response.data?.transactions ||
      response.data.transactions.length === 0
    ) {
      return NextResponse.json(
        { error: "No transactions found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transactions: response.data.transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amounts ? tx.amounts.join(", ") : "",
        status: tx.state,
        createDate: tx.createDate,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    console.error("Error fetching transactions from wallet:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error while fetching transactions" },
      { status: 500 }
    );
  }
}
