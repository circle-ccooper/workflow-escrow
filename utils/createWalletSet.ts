import { circleClient } from "@/utils/circleClient";

const client = circleClient();

interface CircleWalletSet {
  id: string
}

export const createWalletSet = async (entityName: string): Promise<CircleWalletSet> => {
  if (!entityName?.trim()) {
    throw new Error("Entity name is required");
  }

  try {
    const response = await client.createWalletSet({
      name: entityName.trim()
    });

    if (!response.data) {
      throw new Error("The response did not include a valid wallet set");
    }

    return response.data.walletSet;
  } catch (error) {
    // Keep error handling consistent with other files in the codebase
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create wallet set: ${message}`);
  }
}
