import { NextRequest, NextResponse } from "next/server";
import { createWalletSet } from "@/utils/createWalletSet";

export async function POST(req: NextRequest) {
  try {
    const { entityName } = await req.json();

    if (!entityName) {
      return NextResponse.json({ error: "entityName is required" }, { status: 400 });
    }

    const data = await createWalletSet(entityName);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error(`Wallet set creation failed: ${error.message}`);
    return NextResponse.json({ error: "Failed to create wallet set" }, { status: 500 });
  }
}