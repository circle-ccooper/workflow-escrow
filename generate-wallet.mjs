import { config } from "dotenv";
import inquirer from "inquirer";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

config({ path: [".env.local"] })

// Initialize Circle client
export const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const choices = [
  "ETH",
  "ETH-SEPOLIA",
  "AVAX",
  "AVAX-FUJI",
  "MATIC",
  "MATIC-AMOY",
  "SOL",
  "SOL-DEVNET",
  "ARB",
  "ARB-SEPOLIA",
  "NEAR",
  "NEAR-TESTNET",
  "EVM",
  "EVM-TESTNET",
  "UNI-SEPOLIA"
];

// Prompts the user
const { selectedOption } = await inquirer.prompt([
  {
    type: "list",
    name: "selectedOption",
    message: "Select a blockchain to create the agent wallet on:",
    choices: choices,
  },
]);

// Makes the request to Circle's API to create the wallet
try {
  const createdWalletSetResponse = await circleDeveloperSdk.createWalletSet({
    name: "Escrow Agent Wallet"
  });

  const walletSetId = createdWalletSetResponse.data.walletSet.id;
  console.log(`Created wallet set with ID: ${walletSetId}`);

  const createdWalletResponse = await circleDeveloperSdk.createWallets({
    accountType: "SCA",
    blockchains: [selectedOption],
    walletSetId
  });

  const [createdWallet] = createdWalletResponse.data.wallets;
  if (!createdWallet) {
    throw new Error('No wallet was created');
  }

  console.log(`Agent wallet created successfully: ${createdWallet.address}`);
} catch (error) {
  console.error("Failed to create agent wallet:", error.message);
  process.exit(1);
}
  console.log(`Agent wallet created successfully: ${createdWallet.address}`);
} catch {
  console.error("Could not create agent wallet");
}