import { EscrowAgreement } from "./agreements";

export interface EscrowAgreementWithDetails extends EscrowAgreement {
  // Wallet IDs
  beneficiary_wallet_id: string;
  depositor_wallet_id: string;
  circle_contract_id: string;

  depositor_wallet: {
    profile_id: string;
    wallet_address: string;
    profiles: {
      name: string;
      full_name: string;
      email: string;
      company_name: string;
      auth_user_id: string;
    }
  };
  beneficiary_wallet: {
    profile_id: string;
    wallet_address: string;
    profiles: {
      name: string;
      full_name: string;
      email: string;
      company_name: string;
      auth_user_id: string;
    };
  };
  transaction: {
    amount: number;
    currency: string;
    status: string;
    circle_contract_address: string;
  };
}

export interface EscrowListProps {
  userId: string;
  profileId: string;
  walletId: string
}

export type AgreementStatus = "PENDING" | "OPEN" | "LOCKED" | "CLOSED";
