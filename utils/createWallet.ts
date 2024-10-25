import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
  throw new Error(
    "Missing required environment variables: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be defined"
  );
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

export const createWallet = async (walletSetId: string) => {
  try {
    const response = await client.createWallets({
      accountType: "SCA",
      blockchains: ["MATIC-AMOY"],
      count: 1,
      walletSetId,
    });

    if (!response.data) {
      throw new Error("The response did not include a valid wallet");
    }

    return response.data.wallets;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred when trying to create a wallet");
  }
}
