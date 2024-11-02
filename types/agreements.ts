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
}

export interface CreateAgreementProps {
  beneficiaryWalletId?: string;
  depositorWalletId: string;
  userId: string;
  userProfileId: string;
  onAnalysisComplete?: (
    analysis: DocumentAnalysis,
    agreement: EscrowAgreement
  ) => void;
}
