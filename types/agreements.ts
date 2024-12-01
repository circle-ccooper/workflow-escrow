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
  terms: {
    amounts?: Array<{
      for: string;
      amount: string;
      location: string;
    }>;
    tasks?: Array<{
      description: string;
      due_date: string;
      responsible_party: string;
      details: string[];
    }>;
    documentUrl?: string;
    originalFileName?: string;
  };
  created_at: string;
  updated_at: string;
  // Wallet relationships
  depositor_wallet: {
    profile_id: string;
    wallet_address: string;
    profiles: {
      name: string;
    };
  };
  beneficiary_wallet: {
    profile_id: string;
    wallet_address: string;
    profiles: {
      name: string;
    };
  };
  transactions: {
    amount: number;
    currency: string;
    status: string;
    circle_contract_address: string;
  };
}


export interface CreateAgreementProps {
  beneficiaryWalletId?: string;
  depositorWalletId?: string;
  userId: string;
  userProfileId?: string;
  onAnalysisComplete?: (
    analysis: DocumentAnalysis,
    agreement: EscrowAgreement
  ) => void;
}
