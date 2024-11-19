"use client";

import type { PostgrestError, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import type {
  EscrowListProps,
  AgreementStatus,
  EscrowAgreementWithDetails,
} from "@/types/escrow";
import { useEffect, useCallback, useState } from "react";
import { FileText, ExternalLink, RotateCw, CircleDollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStatusColor } from "@/lib/utils/escrow";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEscrowAgreements } from "@/app/hooks/useEscrowAgreements";

import { CreateSmartContractButton } from "./deploy-smart-contract-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Separator } from "@/components/ui/separator";
import { SmartContractResponse } from "@/app/hooks/useSmartContract";
import { createAgreementService } from "@/app/services/agreement.service";
import { parseAmount } from "@/lib/utils/amount";

interface Task {
  description: string;
  due_date: string;
  responsible_party: string;
  details: string[];
}

interface Amount {
  for: string;
  amount: string;
  location: string;
}

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://127.0.0.1:3000";

export const EscrowAgreements = (props: EscrowListProps) => {
  const [depositing, setDepositing] = useState(false);
  const { agreements, loading, error, refresh } = useEscrowAgreements(props);
  const supabase = createSupabaseBrowserClient();
  const agreementService = createAgreementService(supabase);

  const depositFunds = async (agreement: EscrowAgreementWithDetails) => {
    setDepositing(true);

    const response = await fetch(`${baseUrl}/api/contracts/escrow/deposit`, {
      method: "POST",
      body: JSON.stringify({
        circleContractId: agreement.circle_contract_id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    setDepositing(false);

    await supabase
      .from("escrow_agreements")
      .update({ status: "PENDING" })
      .eq("id", agreement.id);

    const parsedResponse = await response.json();

    if (parsedResponse.error) {
      toast.error("Failed to deposit funds into smart contract", {
        description: parsedResponse.error
      });

      await supabase
        .from("escrow_agreements")
        .update({ status: "OPEN" })
        .eq("id", agreement.id);

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
      transactionType: "FUNDS_DEPOSIT",
      profileId: props.profileId,
      amount,
      description: agreement.terms.amounts?.[0]?.for || "Funds deposited by depositor",
    });
  }

  // Runs exclusively after smart contract creation
  const updateTransactionId = async (agreement: EscrowAgreementWithDetails, response: SmartContractResponse) => {
    // Update circle_contract_id
    // This is needed so we can find the agreement later on to deposit funds to it
    const { error: agreementError } = await supabase
      .from("escrow_agreements")
      .update({ circle_contract_id: response.id })
      .eq("id", agreement.id);

    if (agreementError) {
      console.error("Failed to update Circle contract ID:", agreementError);
      toast.error("An error occurred while updating the Circle contract ID");
    }

    // Update circle_transaction_id (is "PENDING" by default on creation)
    // This is needed so we can find the transaction later on and update it's status
    const { error: transactionError } = await supabase
      .from("transactions")
      .update({ circle_transaction_id: response.transactionId })
      .eq("id", agreement.transaction_id);

    if (transactionError) {
      console.error("Failed to update Circle transaction ID:", transactionError);
      toast.error("An error occured while updating the Circle transaction ID");
    }
  }

  // Runs when there are changes to "FUNDS_DEPOSIT" transactions
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

    if (fundsDepositStatus !== "CONFIRMED") return;

    await supabase
      .from("escrow_agreements")
      .update({ status: "LOCKED" })
      .eq("id", payload.new.escrow_agreement_id);

    refresh();
  }, [supabase, refresh]);

  // Runs when there are changes to "ESCROW_DEPOSIT" transactions
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
      .eq("transaction_id", payload.old.id)
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

    console.log("Escrow agreement status update:", smartContractDeploymentStatus);
    toast.info(`Escrow agreement status update: ${smartContractDeploymentStatus}`);

    const shouldRefresh = smartContractDeploymentStatus === "PENDING" || smartContractDeploymentStatus === "CONFIRMED";

    if (!shouldRefresh) return

    // Updates the agreement status
    const { error: agreementStatusUpdateError } = await supabase
      .from("escrow_agreements")
      .update({
        status: smartContractDeploymentStatus === "CONFIRMED"
          ? "OPEN"
          : smartContractDeploymentStatus
      })
      .eq("transaction_id", payload.old.id);

    if (agreementStatusUpdateError) {
      console.error("Could not update smart contract status", agreementStatusUpdateError);
      return;
    }

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
          table: "transactions",
          filter: "transaction_type=eq.ESCROW_DEPOSIT"
        },
        updateAgreementsDeploymentStatus
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
          filter: "transaction_type=eq.FUNDS_DEPOSIT"
        },
        updateAgreementDepositStatus
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
      supabase.removeChannel(agreementDepositSubscription);
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
            {agreements.map((agreement: EscrowAgreementWithDetails) => (
              <div key={agreement.id} className="rounded-lg border p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">
                      Agreement with{" "}
                      {props.profileId === agreement.depositor_wallet?.profile_id
                        ? agreement.beneficiary_wallet?.profiles.name
                        : agreement.depositor_wallet?.profiles.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(agreement.created_at).toLocaleString()}
                    </p>
                  </div>

                  {agreement.status !== "INITIATED" && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                          agreement.status as AgreementStatus
                        )}`}
                      >
                        {agreement.status}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  {(props.userId === agreement.depositor_wallet?.profiles?.auth_user_id && agreement.status === "INITIATED") && (
                    <CreateSmartContractButton
                      depositorAddress={
                        agreement.depositor_wallet?.wallet_address
                      }
                      beneficiaryAddress={
                        agreement.beneficiary_wallet?.wallet_address
                      }
                      amountUSDC={
                        agreement.terms.amounts && agreement.terms.amounts.length > 0
                          ? parseFloat(agreement.terms.amounts[0]?.amount.replace(/[$,]/g, ""))
                          : undefined
                      }
                      onSuccess={response => updateTransactionId(agreement, response)}
                    />
                  )}
                  {(props.userId === agreement.depositor_wallet?.profiles?.auth_user_id && agreement.status === "OPEN") && (
                    <Button disabled={depositing} onClick={() => depositFunds(agreement)}>
                      {depositing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CircleDollarSign className="mr-2 h-4 w-4" />
                          Deposit funds
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <Separator className="my-4" />
                {agreement.terms.documentUrl && (
                  <a
                    href={agreement.terms.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90"
                  >
                    <FileText className="h-4 w-4" />
                    {agreement.terms.originalFileName}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {agreement.terms.amounts &&
                  agreement.terms.amounts.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground mt-3">
                        Amounts ({agreement.terms.amounts?.length})
                      </p>
                      <ul className="mt-1 space-y-1">
                        {agreement.terms.amounts?.map(
                          (amount: Amount, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground"
                            >
                              • {amount.for} - {amount.amount}
                              <span className="text-xs ml-1">
                                ({amount.location})
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  )}
                {agreement.terms.tasks && agreement.terms.tasks.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mt-3">
                      Tasks ({agreement.terms.tasks?.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {agreement.terms.tasks?.map(
                        (task: Task, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {task.description}
                            {task.due_date && (
                              <span className="ml-1 text-xs">
                                (Due: {task.due_date})
                              </span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
