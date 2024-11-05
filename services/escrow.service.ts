import { SupabaseClient } from "@supabase/supabase-js";
import { EscrowAgreementWithDetails } from "@/types/escrow";

export const createEscrowService = (supabase: SupabaseClient) => ({
  async getAgreements(
    profileId: string
  ): Promise<EscrowAgreementWithDetails[]> {
    const { data: profileWallet, error: walletError } = await supabase
      .from("wallets")
      .select("id")
      .eq("profile_id", profileId)
      .single();

    if (walletError) {
      console.error("Error fetching wallets:", walletError);
      throw new Error(`Failed to fetch wallets: ${walletError.message}`);
    }

    if (!profileWallet) {
      console.log("No wallets found for the current user.");
      throw new Error("No wallets found for the current user");
    }

    const { data, error } = await supabase
      .from("escrow_agreements")
      .select(`
        *,
        depositor_wallet:wallets!escrow_agreements_depositor_wallet_id_fkey (
          profile_id
        ),
        beneficiary_wallet:wallets!escrow_agreements_beneficiary_wallet_id_fkey (
          profile_id,
          profiles!wallets_profile_id_fkey (
            name
          )
        ),
        transactions (
          amount,
          currency,
          status
        )
      `)
      .or([
        { depositor_wallet_id: profileWallet.id },
        { beneficiary_wallet_id: profileWallet.id }
      ]);

    if (error) {
      throw new Error(`Failed to fetch agreements: ${error.message}`);
    }

    return data || [];
  },
});
