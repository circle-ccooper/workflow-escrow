import { SupabaseClient } from "@supabase/supabase-js";
import { EscrowAgreementWithDetails } from "@/types/escrow";

export const createEscrowService = (supabase: SupabaseClient) => ({
  async getAgreements(
    profileId: string
  ): Promise<EscrowAgreementWithDetails[]> {
    console.log(profileId);
    const { data, error } = await supabase
      .from("escrow_agreements")
      .select("*")
            

    //depositor_wallet_id links to wallets table that has a column called profile_id
    //that should match the profileId
    //make this relation in the query

    if (error) {
      throw new Error(`Failed to fetch agreements: ${error.message}`);
    }

    return data || [];
  },
});
