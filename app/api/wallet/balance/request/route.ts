import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    if (!process.env.CIRCLE_BLOCKCHAIN) {
      throw new Error("CIRCLE_BLOCKCHAIN environment variable is not defined");
    }

    await fetch("https://api.circle.com/v1/faucet/drips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CIRCLE_API_KEY}`
      },
      body: JSON.stringify({
        address: body.walletAddress,
        blockchain: process.env.CIRCLE_BLOCKCHAIN,
        usdc: true
      })
    });

    return NextResponse.json({ message: "Funds requested successfully" });
  } catch (error) {
    console.error("Failed to request USDC via faucet", error);
    return NextResponse.json({ error: "Failed to request USDC via faucet" }, { status: 500 });
  }
}
