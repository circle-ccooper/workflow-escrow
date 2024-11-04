import { SupabaseClient } from "@supabase/supabase-js";
import { EscrowAgreementWithDetails } from "@/types/escrow";

export const createEscrowService = (supabase: SupabaseClient) => ({
  async getAgreements(
    profileId: string
  ): Promise<EscrowAgreementWithDetails[]> {
    const { data, error } = await supabase
      .from("escrow_agreements")
      .select(
        `
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
    `
      )
      .filter("depositor_wallet.profile_id", "eq", profileId);

    if (error) {
      throw new Error(`Failed to fetch agreements: ${error.message}`);
    }

    return data || [];
  },
});
