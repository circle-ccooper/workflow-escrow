export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  profile_id: string;
  wallet_address: string;
  circle_wallet_id: string;
  balance: string;
  blockchain: string;
  created_at: string;
  profile?: Profile;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  profile_id: string;
  circle_transaction_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

export interface EscrowAgreement {
  id: string;
  beneficiary_wallet_id: string;
  depositor_wallet_id: string;
  transaction_id: string;
  circle_contract_id: string;
  status: string;
  terms: {
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
    documentUrl?: string;
    originalFileName?: string;
  };
  created_at: string;
  updated_at: string;
  beneficiary_wallet?: Wallet & {
    profile?: Profile;
  };
  depositor_wallet?: Wallet & {
    profile?: Profile;
  };
  transaction?: Transaction;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'created_at'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'created_at'>;
        Update: Partial<Omit<Wallet, 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'created_at'>;
        Update: Partial<Omit<Transaction, 'created_at'>>;
      };
      escrow_agreements: {
        Row: EscrowAgreement;
        Insert: Omit<EscrowAgreement, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EscrowAgreement, 'created_at' | 'updated_at'>>;
      };
    };
  };
};