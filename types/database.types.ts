export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  circle_wallet_id: string;
  wallet_type: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  amounts?: Array<string>;
  state: string;
  createDate: string;
  blockchain: string;
  transactionType: string;
  updateDate: string;
}

export interface EscrowAgreement {
  id: string;
  beneficiary_wallet_id: string;
  depositor_wallet_id: string;
  transaction_id: string;
  status: string;
  disbursement_date: string;
  terms: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DisputeResolution {
  id: string;
  escrow_agreement_id: string;
  resolver_user_id: string;
  status: string;
  resolution_type: string;
  description: string;
  created_at: string;
  resolved_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id">>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Wallet, "id">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id">>;
      };
      escrow_agreements: {
        Row: EscrowAgreement;
        Insert: Omit<EscrowAgreement, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<EscrowAgreement, "id">>;
      };
      dispute_resolutions: {
        Row: DisputeResolution;
        Insert: Omit<DisputeResolution, "id" | "created_at" | "resolved_at">;
        Update: Partial<Omit<DisputeResolution, "id">>;
      };
    };
  };
}
