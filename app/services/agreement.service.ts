import { SupabaseClient } from "@supabase/supabase-js";
import { EscrowAgreement } from "@/types/agreements";

export const createAgreementService = (supabase: SupabaseClient) => ({
  async createTransaction(params: {
    walletId: string;
    circleTransactionId?: string;
    escrowAgreementId?: string;
    transactionType?: string;
    profileId: string;
    amount: number;
    description: string;
  }) {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        wallet_id: params.walletId,
        profile_id: params.profileId,
        circle_transaction_id: params.circleTransactionId,
        escrow_agreement_id: params.escrowAgreementId,
        transaction_type: params.transactionType || "DEPLOY_CONTRACT",
        amount: params.amount,
        currency: "USD",
        status: "PENDING",
        description: params.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return transaction;
  },

  async createAgreement(params: {
    beneficiaryWalletId: string;
    depositorWalletId: string;
    transactionId: string;
    terms: any;
  }): Promise<EscrowAgreement> {
    const { data: agreement, error } = await supabase
      .from("escrow_agreements")
      .insert({
        beneficiary_wallet_id: params.beneficiaryWalletId,
        depositor_wallet_id: params.depositorWalletId,
        transaction_id: params.transactionId,
        status: "INITIATED",
        terms: params.terms,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create agreement: ${error.message}`);
    }

    return agreement;
  },

  async updateAgreementTerms(agreementId: string, terms: any): Promise<void> {
    const { error } = await supabase
      .from("escrow_agreements")
      .update({ terms })
      .eq("id", agreementId);

    if (error) {
      throw new Error(`Failed to update agreement: ${error.message}`);
    }
  },

  async deleteAgreementAndTransaction(
    agreementId: string,
    transactionId: string
  ): Promise<void> {
    try {
      await Promise.all([
        supabase.from("escrow_agreements").delete().eq("id", agreementId),
        supabase.from("transactions").delete().eq("id", transactionId),
      ]);
    } catch (error) {
      const errorMessage = (error as any).message || "Unknown error";
      throw new Error(`Failed to delete agreement and transaction: ${errorMessage}`);
    }
  },
});
