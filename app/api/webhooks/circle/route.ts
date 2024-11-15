import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

async function updateEscrowAgreement(transactionId: string, newStatus: string) {
  const supabase = createSupabaseServerClient();

  // Fetch the current status in the database to check if the update is needed
  const { data, error } = await supabase
    .from("transactions")
    .select("status")
    .eq("circle_transaction_id", transactionId)
    .single();

  // Exit if no update is needed
  if (error || data.status === newStatus) return;

  // Perform the update only if the status has changed
  await supabase
    .from("transactions")
    .update({ status: newStatus })
    .eq("circle_transaction_id", transactionId);
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-circle-signature");
    const keyId = req.headers.get("x-circle-key-id");

    if (!signature || !keyId) {
      return NextResponse.json(
        { error: "Missing signature or keyId in headers" },
        { status: 400 }
      );
    }

    // Parse the JSON body only once
    const body = await req.json();
    const bodyString = JSON.stringify(body); // Convert to a string for signature verification

    const isVerified = await verifyCircleSignature(bodyString, signature, keyId);
    if (!isVerified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Filter notifications based on criteria for smart contract deployment
    if (
      body.notificationType === "transactions.outbound" && // Outbound transaction type
      body.notification.transactionType === "OUTBOUND" && // Transaction type indicating deployment
      body.notification.state && // State should be defined
      body.notification.contractAddress // Presence of contractAddress indicates contract interaction
    ) {
      const transactionId = body.notification.id;

      // Update or handle the contract deployment status in escrow_agreements
      await updateEscrowAgreement(transactionId, body.notification.state);
    }

    console.log("Received notification:", body);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process notification: ${message}` },
      { status: 500 }
    );
  }
}

// Handle HEAD requests to verify endpoint availability
export async function HEAD() {
  return NextResponse.json({}, { status: 200 });
}

// Verify Circle's signature
async function verifyCircleSignature(
  bodyString: string,
  signature: string,
  keyId: string
): Promise<boolean> {
  const publicKey = await getCirclePublicKey(keyId);

  const verifier = crypto.createVerify("SHA256");
  verifier.update(bodyString);
  verifier.end();

  // Convert the Buffer to a Uint8Array for compatibility
  const signatureUint8Array = Uint8Array.from(Buffer.from(signature, "base64"));
  return verifier.verify(publicKey, signatureUint8Array);
}

// Function to get Circle’s public key using their API
async function getCirclePublicKey(keyId: string) {
  if (!process.env.CIRCLE_API_KEY) {
    throw new Error("Circle API key is not set");
  }

  try {
    const response = await fetch(`https://api.circle.com/v2/notifications/publicKey/${keyId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.CIRCLE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch public key: ${response.statusText}`);
    }

    const data = await response.json();
    const rawPublicKey = data.data.publicKey;

    // Convert the base64-encoded key to PEM format
    const pemPublicKey = `-----BEGIN PUBLIC KEY-----\n${rawPublicKey.match(/.{1,64}/g)?.join("\n")}\n-----END PUBLIC KEY-----`;

    return pemPublicKey;
  } catch (error) {
    console.error("Error fetching Circle public key:", error);
    throw new Error("Failed to retrieve Circle public key");
  }
}
