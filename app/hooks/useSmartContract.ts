import type { EscrowAgreementWithDetails } from '@/types/escrow';
import { useState, useCallback } from 'react';

interface CreateSmartContractRequest {
  agreement: EscrowAgreementWithDetails;
  agentAddress: string;
  agentWalletId: string;
  amountUSDC: number;
}

export interface SmartContractResponse {
  success: boolean;
  id?: string;
  transactionId?: string;
  status: string;
  message?: string;
  addresses?: {
    depositor: string;
    beneficiary: string;
    agent: string;
  };
  error?: string;
  details?: string;
}

interface TransactionStatusResponse {
  success: boolean;
  status?: string;
  transaction?: {
    state: string;
    [key: string]: any;
  };
  error?: string;
  details?: string;
}

interface UseSmartContractReturn {
  createSmartContract: (data: CreateSmartContractRequest) => Promise<SmartContractResponse>;
  checkStatus: (transactionId: string) => Promise<TransactionStatusResponse>;
  isLoading: boolean;
  error: string | null;
}

export function useSmartContract(): UseSmartContractReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSmartContract = useCallback(async (data: CreateSmartContractRequest): Promise<SmartContractResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contracts/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Smart contract');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while creating the Smart contract';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const checkStatus = useCallback(async (transactionId: string): Promise<TransactionStatusResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/escrow?id=${transactionId}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check transaction status');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while checking the transaction status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    createSmartContract,
    checkStatus,
    isLoading,
    error,
  };
}