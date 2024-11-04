import { EscrowAgreement } from "./agreements";

export interface EscrowAgreementWithDetails extends EscrowAgreement {
  depositor_wallet: {
    profile_id: string;
  };
  beneficiary_wallet: {
    profile_id: string;
    profiles: {
      // Changed from profile to profiles to match Supabase query structure
      name: string;
    };
  };
  transactions: {
    // Changed from transaction to transactions to match array return
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
