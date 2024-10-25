import { NextRequest, NextResponse } from "next/server";
import { createWallet } from "@/utils/createWallet"

export async function POST(req: NextRequest) {
  const { walletSetId } = await req.json();

  if (!walletSetId) {
    return NextResponse.json(
      { error: "walletSetId is required" },
      { status: 400 }
    );
  }

  try {
    const data = await createWallet(walletSetId);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
