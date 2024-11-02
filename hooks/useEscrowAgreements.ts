import { useState, useEffect } from "react";
import { toast } from "sonner";

import { createEscrowService } from "@/services/escrow.service";
import { EscrowAgreementWithDetails, EscrowListProps } from "@/types/escrow";
import { createClient } from "@/lib/utils/supabase/client";

export const useEscrowAgreements = ({ profileId }: EscrowListProps) => {
  const [agreements, setAgreements] = useState<EscrowAgreementWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const escrowService = createEscrowService(supabase);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const data = await escrowService.getAgreements(profileId);
      setAgreements(data);
      setError(null);
    } catch (err) {
      console.error("Error loading agreements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load agreements"
      );
      toast.error("Error loading agreements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreements();
  }, [profileId]);

  return {
    agreements,
    loading,
    error,
    refresh: loadAgreements,
  };
};
