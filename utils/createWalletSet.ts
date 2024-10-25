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

export const createWalletSet = async (entityName: string) => {
  try {
    const response = await client.createWalletSet({
      name: entityName
    });

    if (!response.data) {
      throw new Error("The response did not include a valid wallet set");
    }

    return response.data.walletSet;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while creating the wallet set")
  }
}