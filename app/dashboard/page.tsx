import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { CreateAgreementPage } from "@/components/ui/createAgreementPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EscrowAgreements } from "@/components/escrow-agreements";
import { WalletBalance } from "@/components/wallet-balance";
import { RequestUsdcButton } from "@/components/request-usdc-button";
import { USDCButton } from "@/components/usdc-button";
import dynamic from "next/dynamic";
import { WalletInformationDialog } from "@/components/wallet-information-dialog";

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
    <>
      <div className="flex flex-wrap space-x-4 mb-4">
        {/* Wallet Card */}
        <Card className="break-inside-avoid w-[calc(50%-0.5rem)]">
          <CardHeader className="flex-row items-center space-between">
            <CardTitle>Account balance</CardTitle>
            <WalletInformationDialog wallet={wallet} />
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-6">
              <div className="flex flex-col space-y-1.5">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                  <WalletBalance walletId={wallet?.circle_wallet_id} />
                </h1>
              </div>
              <div className="flex gap-2">
                <USDCButton className="flex-1" mode="BUY" walletAddress={wallet?.wallet_address} />
                <USDCButton className="flex-1" mode="SELL" walletAddress={wallet?.wallet_address} />
                {process.env.NODE_ENV === "development" && <RequestUsdcButton walletAddress={wallet?.wallet_address} />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Agreement Section */}
        <div className="break-inside-avoid w-[calc(50%-0.5rem)] flex">
          <CreateAgreementPage />
        </div>
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
    </>
  );
}
