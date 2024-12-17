"use client";

import type { PostgrestError, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import type { EscrowListProps, EscrowAgreementWithDetails } from "@/types/escrow";
import { useEffect, useCallback } from "react";
import { RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEscrowAgreements } from "@/app/hooks/useEscrowAgreements";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { createAgreementService } from "@/app/services/agreement.service";
import { parseAmount } from "@/lib/utils/amount";
import EscrowAgreementsTable from "@/components/agreements-table";

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : "http://localhost:3000";

const supabase = createSupabaseBrowserClient();

export const EscrowAgreements = (props: EscrowListProps) => {
  const { agreements, loading, error, refresh } = useEscrowAgreements(props);
  const agreementService = createAgreementService(supabase);

  const depositFunds = async (agreement: EscrowAgreementWithDetails) => {
    try {
      const response = await fetch(`${baseUrl}/api/contracts/escrow/deposit`, {
        method: "POST",
        body: JSON.stringify({
          circleContractId: agreement.circle_contract_id
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      const parsedResponse = await response.json();

      if (parsedResponse.error) {
        toast.error("Failed to deposit funds into smart contract", {
          description: parsedResponse.error
        });

        return;
      }

      if (!agreement.terms.amounts?.[0].amount) {
        toast.error("The contract does not specifies an amount to be paid");
        return;
      }

      refresh();

      const amount = parseAmount(agreement.terms.amounts?.[0].amount);
      await agreementService.createTransaction({
        walletId: agreement.depositor_wallet_id,
        circleTransactionId: parsedResponse.transactionId,
        escrowAgreementId: agreement.id,
        transactionType: "DEPOSIT_PAYMENT",
        profileId: props.profileId,
        amount,
        description: agreement.terms.amounts?.[0]?.for || "Funds deposited by depositor",
      });
    } catch (error) {
      console.error("Deposit operation failed:", error);
      toast.error("Failed to complete deposit operation");
    }
  }

  // Runs when there are changes to "RELEASE_PAYMENT" transactions
  const updateAgreementReleaseStatus = useCallback(async (payload: RealtimePostgresUpdatePayload<Record<string, string>>) => {
    const { data: agreementUser, error: agreementUserError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", props.userId)
      .single();

    if (agreementUserError) {
      console.error("Could not retrieve the currently logged in user id:", agreementUserError);
      toast.error("Could not retrieve the currently logged in user id", {
        description: agreementUserError.message
      });

      return;
    }

    const isBeneficiary = agreementUser.id === payload.new.profile_id;

    if (!isBeneficiary) return;

    const fundsReleaseStatus = payload.new.status;

    console.log("Funds release status update:", fundsReleaseStatus);
    toast.info(`Funds release status update: ${fundsReleaseStatus}`);

    if (fundsReleaseStatus === "FAILED") {
      refresh();
      return;
    }

    if (fundsReleaseStatus !== "CONFIRMED") return;

    refresh();
  }, [supabase, refresh]);

  // Runs when there are changes to "DEPOSIT_APPROVAL" transactions
  const updateAgreementDepositApprovalStatus = useCallback(async (payload: RealtimePostgresUpdatePayload<Record<string, string>>) => {
    const { data: agreementUser, error: agreementUserError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", props.userId)
      .single();

    if (agreementUserError) {
      console.error("Could not retrieve the currently logged in user id:", agreementUserError);
      toast.error("Could not retrieve the currently logged in user id", {
        description: agreementUserError.message
      });

      return;
    }

    const isDepositAuthor = agreementUser.id === payload.new.profile_id;

    if (!isDepositAuthor) return;

    const fundsDepositStatus = payload.new.status;

    console.log("Funds deposit approval status update:", fundsDepositStatus);
    toast.info(`Funds deposit approval status update: ${fundsDepositStatus}`);

    if (fundsDepositStatus === "FAILED") {
      refresh();
      return;
    }

    if (fundsDepositStatus !== "COMPLETE") return;

    const { data: agreement, error: agreementError } = await supabase
      .from("escrow_agreements")
      .select()
      .eq("id", payload.new.escrow_agreement_id)
      .single() as { data: EscrowAgreementWithDetails, error: PostgrestError | null };

    if (agreementError) {
      console.error("Error retrieving agreement details", agreementError);
      toast.error("Error retrieving agreement details", {
        description: agreementError.message
      });

      return;
    }

    await depositFunds(agreement);
  }, [supabase]);

  // Runs when there are changes to "DEPOSIT_PAYMENT" transactions
  const updateAgreementDepositStatus = useCallback(async (payload: RealtimePostgresUpdatePayload<Record<string, string>>) => {
    const { data: agreementUser, error: agreementUserError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", props.userId)
      .single();

    if (agreementUserError) {
      console.error("Could not retrieve the currently logged in user id:", agreementUserError);
      toast.error("Could not retrieve the currently logged in user id", {
        description: agreementUserError.message
      });

      return;
    }

    const isDepositAuthor = agreementUser.id === payload.new.profile_id;

    if (!isDepositAuthor) return;

    const fundsDepositStatus = payload.new.status;

    console.log("Funds deposit status update:", fundsDepositStatus);
    toast.info(`Funds deposit status update: ${fundsDepositStatus}`);

    if (fundsDepositStatus === "FAILED") {
      refresh();
      return;
    }

    if (fundsDepositStatus !== "CONFIRMED") return;

    refresh();
  }, [supabase, refresh]);

  // Runs when there are changes to "DEPLOY_CONTRACT" transactions
  const updateAgreementsDeploymentStatus = useCallback(async (payload: RealtimePostgresUpdatePayload<Record<string, string>>) => {
    // Get the id of users involved in the agreement from their wallets
    const { data: agreementUsers, error: agreementUsersError } = await supabase
      .from("escrow_agreements")
      .select(`
        beneficiary_wallet_id,
        depositor_wallet_id,
        depositor_wallet:wallets!depositor_wallet_id(
          profile_id,
          wallet_address,
          profiles:profiles!wallets_profile_id_fkey (
            name,
            auth_user_id
          )
        ),
        beneficiary_wallet:wallets!beneficiary_wallet_id(
          profile_id,
          wallet_address,
          profiles:profiles!wallets_profile_id_fkey (
            name,
            auth_user_id
          )
        )
      `)
      .eq("id", payload.old.id)
      .single() as { data: EscrowAgreementWithDetails, error: PostgrestError | null };

    if (agreementUsersError) {
      console.error("Could not find an agreement linked to the given transaction", agreementUsersError);
      return;
    }

    const userIds = [
      agreementUsers.depositor_wallet?.profiles?.auth_user_id,
      agreementUsers.beneficiary_wallet?.profiles?.auth_user_id
    ]

    const isUserInvolvedInAgreement = userIds.includes(props.userId);

    if (!isUserInvolvedInAgreement) return;

    const smartContractDeploymentStatus = payload.new.status;

    // This means that the smart contract has just been created
    if (payload.new.circle_contract_id && smartContractDeploymentStatus === "INITIATED") {
      toast.success("Smart contract created", {
        description: "Your smart contract is being processed",
      });

      return;
    };

    if (smartContractDeploymentStatus === "INITIATED") return;

    console.log("Smart contract status update:", smartContractDeploymentStatus);
    toast.info(`Smart contract status update: ${smartContractDeploymentStatus}`);

    const shouldRefresh = ["PENDING", "OPEN"].includes(smartContractDeploymentStatus);

    if (!shouldRefresh) return

    refresh();
  }, [supabase, refresh]);

  useEffect(() => {
    const agreementDeploymentSubscription = supabase
      .channel("agreement_deployment_transactions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "escrow_agreements"
        },
        updateAgreementsDeploymentStatus
      )
      .subscribe();

    const agreementApprovalSubscription = supabase
      .channel("agreement_approval_transactions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: "transaction_type=eq.DEPOSIT_APPROVAL"
        },
        updateAgreementDepositApprovalStatus
      )
      .subscribe();

    const agreementDepositSubscription = supabase
      .channel("agreement_deposit_transactions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: "transaction_type=eq.DEPOSIT_PAYMENT"
        },
        updateAgreementDepositStatus
      )
      .subscribe();

    const agreementReleaseSubscription = supabase
      .channel("agreement_release_transactions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: "transaction_type=eq.RELEASE_PAYMENT"
        },
        updateAgreementReleaseStatus
      )
      .subscribe();

    const escrowAgreementsSubscription = supabase
      .channel("refresh_agreement_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "escrow_agreements"
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agreementDeploymentSubscription);
      supabase.removeChannel(agreementApprovalSubscription);
      supabase.removeChannel(agreementDepositSubscription);
      supabase.removeChannel(agreementReleaseSubscription);
      supabase.removeChannel(escrowAgreementsSubscription);
    }
  }, [supabase, updateAgreementsDeploymentStatus, refresh]);

  if (error) {
    return (
      <Card className="break-inside-avoid mb-4 w-full">
        <CardHeader>
          <CardTitle>Escrow Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            <p>{error}</p>
            <Button variant="outline" onClick={refresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="break-inside-avoid mb-4 w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        {loading ? (
          <Skeleton className="w-[250px] h-[24px] rounded-full" />
        ) : (
          <CardTitle>Escrow Agreements</CardTitle>
        )}
        {loading ? (
          <Skeleton className="w-[32px] h-[32px] rounded-full" />
        ) : (
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {agreements.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            {loading ? (
              <Skeleton className="w-[160px] h-[24px] rounded-full" />
            ) : (
              <p>No agreements found</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <EscrowAgreementsTable
              agreements={agreements}
              profileId={props.profileId}
              userId={props.userId}
              refresh={refresh}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
