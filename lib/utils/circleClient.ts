import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

let client: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null =
  null;

export const circleClient = () => {
  if (!client) {
    try {
      client = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });
    } catch (error) {
      console.error("Failed to initialize Circle client:", error);
      throw new Error("Failed to initialize Circle client");
    }
  }

  return client;
};
