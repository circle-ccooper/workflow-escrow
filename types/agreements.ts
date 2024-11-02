export interface DocumentAnalysis {
  amounts: Array<{
    full_amount: string;
    payment_for: string;
    location: string;
  }>;
  tasks: Array<{
    task_description: string;
    due_date: string | null;
    responsible_party: string;
    additional_details: string;
  }>;
}

export interface EscrowAgreement {
  id: string;
  beneficiary_wallet_id: string;
  depositor_wallet_id: string;
  transaction_id: string;
  status: string;
  terms: any;
  created_at: string;
  updated_at: string;
  // Add nested relationships
  depositor_wallet: {
    profile_id: string;
  };
  beneficiary_wallet: {
    profile_id: string;
    profiles: {
      name: string;
    };
  };
  transactions: {
    amount: number;
  }[];
}

/** Properties required to create a new escrow agreement */
export interface CreateAgreementProps {
  beneficiaryWalletId?: string;
  depositorWalletId: string;
  userId: string; // ID of the user creating the agreement
  userProfileId: string; // Profile ID associated with the creating user
  onAnalysisComplete?: (
    analysis: DocumentAnalysis,
    agreement: EscrowAgreement
  ) => Promise<void>; // Called after successful document analysis and agreement creation
}
