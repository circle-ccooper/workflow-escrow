import type { Blockchain } from "@circle-fin/developer-controlled-wallets";
import { circleClient } from "@/utils/circleClient";

const client = circleClient();

type WalletOptions = {
  accountType?: "SCA"
  blockchain?: Blockchain
  count?: number
  walletSetId: string
};

export const createWallet = async ({
  accountType = "SCA",
  blockchain = "MATIC-AMOY",
  count = 1,
  walletSetId
}: WalletOptions) => {
  if (!walletSetId?.trim()) {
    throw new Error("walletSetId is required");
  }

  try {
    const response = await client.createWallets({
      accountType,
      blockchains: [blockchain],
      count,
      walletSetId
    });

    if (!response.data?.wallets?.length) {
      throw new Error("No wallets were created");
    }

    return response.data.wallets;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create wallet: ${message}`);
  }
};
