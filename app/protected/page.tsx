import type { WalletTransactionsResponse } from "@/app/api/wallet/transactions/route";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Transactions } from "@/components/transactions";

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://localhost:3000";

export default async function ProtectedPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: temporaryUser } = await supabase
    .schema("public")
    .from("users")
    .select("id")
    .eq("email", user.email)
    .single();

  const { data: wallet } = await supabase
    .schema("public")
    .from("wallets")
    .select("circle_wallet_id")
    .eq("user_id", temporaryUser?.id)
    .single();

  const transactionsResponse = await fetch(
    `${baseUrl}/api/wallet/transactions`,
    {
      method: "POST",
      body: JSON.stringify({
        walletId: wallet?.circle_wallet_id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const parsedTransactions: WalletTransactionsResponse =
    await transactionsResponse.json();
  const transactions = parsedTransactions.error
    ? []
    : parsedTransactions.transactions;

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your wallet</h2>
        <p className="text-xl text-muted-foreground cursor-pointer mb-4">
          {wallet?.circle_wallet_id || "No wallet found"}
        </p>
        <h2 className="font-bold text-2xl mb-4">Your transactions</h2>
        <Transactions data={transactions} />
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(
            {
              ...user,
              wallet_id: wallet?.circle_wallet_id,
              transactions,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
