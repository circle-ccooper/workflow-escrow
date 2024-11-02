import { EscrowAgreement } from "./agreements";

export interface EscrowAgreementWithDetails extends EscrowAgreement {
    beneficiary_wallet: {
      profile: {
        name: string;
      };
    };
    transaction: {
      amount: number;
      currency: string;
      status: string;
    };
  }
  
  export interface EscrowListProps {
    userId: string;
    profileId: string;
  }
  
  export type AgreementStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';