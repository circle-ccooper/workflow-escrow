import { type NextRequest, NextResponse } from "next/server";
import { createRampSession } from "@/lib/utils/create-circle-ramp-session";

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    if (!body.wallet_address) {
      return NextResponse.json(
        { error: "Missing wallet_address" },
        { status: 500 }
      )
    }

    const usdcAccessResponse = await createRampSession("SELL", body.wallet_address)

    return NextResponse.json({ url: usdcAccessResponse.data.url })
  } catch (error) {
    console.error("Error requesting sell url:", error);

    return NextResponse.json(
      { error: "Internal server error while requesting sell url" },
      { status: 500 }
    );
  }
}
