import { type NextRequest, NextResponse } from "next/server";
import { circleDeveloperSdk } from "@/lib/utils/developer-controlled-wallets-client";
import { z } from "zod";

const ResponseSchema = z.object({
  transaction: z
    .object({
      id: z.string(),
      amounts: z.array(z.string()).optional(),
      state: z.string(),
      createDate: z.string(),
      blockchain: z.string(),
      transactionType: z.string(),
      updateDate: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

type TransactionResponse = z.infer<typeof ResponseSchema>;

if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
  throw new Error(
    "Missing required environment variables: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be defined",
  );
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<TransactionResponse>> {
  try {
    // Validate the transaction ID is a Circle's transaction IDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID format" },
        { status: 400 },
      );
    }

    const response = await circleDeveloperSdk.getTransaction({
      id: params.id,
    });

    const parseResult = ResponseSchema.safeParse({
      transaction: response.data?.transaction,
    });
    if (!parseResult.success) {
      console.error("Response validation failed:", parseResult.error);
      return NextResponse.json(
        { error: "Invalid response from Circle API" },
        { status: 500 },
      );
    }

    if (!response.data || response.data.transaction === undefined) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    //Needs to be fixed
    const transaction: any = {
      id: response.data.transaction.id,
      amounts: response.data.transaction.amounts,
      state: response.data.transaction.state,
      createDate: response.data.transaction.createDate,
      blockchain: response.data.transaction.blockchain,
      transactionType: response.data.transaction.transactionType,
      updateDate: response.data.transaction.updateDate,
    };

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error fetching transaction:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error while fetching transaction" },
      { status: 500 },
    );
  }
}
