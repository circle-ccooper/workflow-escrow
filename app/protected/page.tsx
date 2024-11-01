import type { WalletTransactionsResponse } from "@/app/api/wallet/transactions/route";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { Transactions } from "@/components/transactions";
import { CreateAgreementPage } from "@/components/ui/createAgreementPage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://127.0.0.1:3000";

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
    }
  );

  const parsedTransactions: WalletTransactionsResponse =
    await transactionsResponse.json();
  const transactions = parsedTransactions.error
    ? []
    : parsedTransactions.transactions;

  return (
    <div className="columns-2 gap-4">
      <Card className="break-inside-avoid mb-4 w-full">
        <CardHeader>
          <CardTitle>Your wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
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
          </div>
        </CardContent>
      </Card>

      <div className="break-inside-avoid mb-4">
        <CreateAgreementPage />
      </div>

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
