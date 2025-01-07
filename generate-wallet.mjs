import { config } from "dotenv";
import inquirer from "inquirer";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import fs from 'fs';
import path from 'path';

config({ path: [".env.local"] })

// Initialize Circle client
const requiredEnvVars = ['CIRCLE_API_KEY', 'CIRCLE_ENTITY_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

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

  console.log(`Agent wallet created successfully. Address: ${createdWallet.address}, ID: ${createdWallet.id}`);

  // Update environment variables in .env.local
  const envPath = path.resolve('.env.local');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Update the environment variables
  envContent = envContent.replace(/^NEXT_PUBLIC_AGENT_WALLET_ID=.*$/m, `NEXT_PUBLIC_AGENT_WALLET_ID=${createdWallet.id}`);
  envContent = envContent.replace(/^NEXT_PUBLIC_AGENT_WALLET_ADDRESS=.*$/m, `NEXT_PUBLIC_AGENT_WALLET_ADDRESS=${createdWallet.address}`);
  envContent = envContent.replace(/^CIRCLE_BLOCKCHAIN=.*$/m, `CIRCLE_BLOCKCHAIN=${selectedOption}`);

  // Write the updated content back to .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('Environment variables updated successfully in .env.local');
} catch (error) {
  console.error("Failed to create agent wallet:", error.message);
  process.exit(1);
}
