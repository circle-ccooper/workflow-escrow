import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { CreateAgreementPage } from "@/components/ui/createAgreementPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { WalletTransactionsResponse } from "@/app/api/wallet/transactions/route";
import { EscrowAgreements } from "@/components/escrow-agreements";
import { WalletBalance } from "@/components/wallet-balance";
import { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { RequestUsdcButton } from "@/components/request-usdc-button";
import { USDCButton } from "@/components/usdc-button";
import dynamic from "next/dynamic";

interface CircleTransaction {
  id: string;
  transactionType: string;
  amount: string[];
  status: string;
  description?: string;
  circle_contract_address?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : "http://localhost:3000";

async function syncTransactions(
  supabase: SupabaseClient,
  walletId: string,
  profileId: string,
  circleWalletId: string
) {
  // 1. Fetch transactions from Circle API
  const transactionsResponse = await fetch(
    `${baseUrl}/api/wallet/transactions`,
    {
      method: "POST",
      body: JSON.stringify({
        walletId: circleWalletId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const parsedTransactions: WalletTransactionsResponse =
    await transactionsResponse.json();

  if (parsedTransactions.error || !parsedTransactions.transactions) {
    return [];
  }

  // 2. Get existing transactions from database
  const { data: existingTransactions } = await supabase
    .from("transactions")
    .select("circle_transaction_id")
    .eq("wallet_id", walletId);

  const existingTransactionIds = new Set(
    existingTransactions?.map((t: any) => t.circle_transaction_id) || []
  );

  // 3. Filter out transactions that already exist
  const newTransactions = parsedTransactions.transactions.filter(
    (transaction: any) => !existingTransactionIds.has(transaction.id)
  );

  // 4. Insert new transactions into the database
  if (newTransactions.length > 0) {
    const transactionsToInsert = newTransactions.map(
      (transaction: CircleTransaction) => {
        if (
          !transaction.id ||
          !transaction.transactionType ||
          !transaction.amount
        ) {
          throw new Error(
            `Invalid transaction structure: ${JSON.stringify(transaction)}`
          );
        }

        return {
          wallet_id: walletId,
          profile_id: profileId,
          circle_transaction_id: transaction.id,
          transaction_type: transaction.transactionType,
          amount: parseFloat(transaction.amount[0]?.replace(/[$,]/g, "")) || 0,
          currency: "USDC",
          status: transaction.status,
        };
      }
    );

    const { error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert);

    if (error) {
      console.error("Error inserting transactions:", error);
    }
  }

  // 5. Return all transactions from database
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false });

  return allTransactions || [];
}

const Transactions = dynamic(() => import('@/components/transactions').then(mod => mod.Transactions), { ssr: false })

export default async function ProtectedPage() {
  const supabase = createSupabaseServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: wallet } = await supabase
    .schema("public")
    .from("wallets")
    .select()
    .eq("profile_id", profile?.id)
    .single();

  // Sync and get transactions
  const transactions = await syncTransactions(
    supabase,
    wallet?.id,
    profile?.id,
    wallet?.circle_wallet_id
  );

  return (
    <div className="columns-2 gap-4">
      {/* Wallet Card */}
      <Card className="break-inside-avoid mb-4 w-full">
        <CardHeader>
          <CardTitle>Your wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Balance
              </h4>
              <WalletBalance walletId={wallet?.circle_wallet_id} />
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                ID
              </h4>
              <div className="flex w-full items-center space-x-2">
                <Input disabled value={wallet?.circle_wallet_id} />
                <CopyButton text={wallet?.circle_wallet_id} />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Address
              </h4>
              <div className="flex w-full items-center space-x-2">
                <Input disabled value={wallet?.wallet_address} />
                <CopyButton text={wallet?.wallet_address} />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Blockchain
              </h4>
              <p className="text-xl text-muted-foreground cursor-pointer mb-4">
                {wallet?.blockchain || "No wallet found"}
              </p>
            </div>
            <div className="flex space-x-2">
              <USDCButton mode="BUY" walletAddress={wallet?.wallet_address} />
              <USDCButton mode="SELL" walletAddress={wallet?.wallet_address} />
              {process.env.NODE_ENV === "development" && <RequestUsdcButton walletAddress={wallet.wallet_address} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Agreement Section */}
      <div className="break-inside-avoid mb-4">
        <CreateAgreementPage />
      </div>

      {/* Agreements Section */}
      <div className="break-inside-avoid mb-4">
        <EscrowAgreements
          userId={user.id}
          profileId={profile?.id}
          walletId={wallet.circle_wallet_id}
        />
      </div>

      {/* Transactions Section */}
      <div className="break-inside-avoid mb-4">
        <div className="flex flex-col gap-2 items-start">
          <Card className="break-inside-avoid mb-4 w-full">
            <CardHeader>
              <CardTitle>Your transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Transactions data={transactions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
