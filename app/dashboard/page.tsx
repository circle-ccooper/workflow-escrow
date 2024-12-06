import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { CreateAgreementPage } from "@/components/ui/createAgreementPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { EscrowAgreements } from "@/components/escrow-agreements";
import { WalletBalance } from "@/components/wallet-balance";
import { RequestUsdcButton } from "@/components/request-usdc-button";
import { USDCButton } from "@/components/usdc-button";
import dynamic from "next/dynamic";

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
              <Transactions wallet={wallet} profile={profile} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
