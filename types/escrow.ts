import { EscrowAgreement } from "./agreements";

export interface EscrowAgreementWithDetails extends EscrowAgreement {
  // Wallet IDs
  beneficiary_wallet_id: string;
  depositor_wallet_id: string;

  
  depositor_wallet: {
    profile_id: string;
    wallet_address: string;
    profiles: {
      name: string;
    }
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
  }[];
}

export interface EscrowListProps {
  userId: string;
  profileId: string;
}

export type AgreementStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";