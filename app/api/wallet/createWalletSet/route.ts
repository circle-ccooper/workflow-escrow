import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { entityName } = await req.json();

    if (!entityName) {
      return NextResponse.json({ error: "entityName is required" }, { status: 400 });
    }

    const response = await client.createWalletSet({
      name: entityName
    });

    return NextResponse.json(response.data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating wallet set:', error.message || 'An unknown error occurred');

    // Send only a simple error message in the response to avoid circular JSON issues
    return NextResponse.json({ error: 'An error occurred while creating the wallet set' }, { status: 500 });
  }
}