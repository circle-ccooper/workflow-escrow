"use client";

import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect, useRef, useState, useCallback } from "react";
import { FileText, ExternalLink, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EscrowListProps,
  AgreementStatus,
  EscrowAgreementWithDetails,
} from "@/types/escrow";
import { getStatusColor } from "@/lib/utils/escrow";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEscrowAgreements } from "@/app/hooks/useEscrowAgreements";

import { CreateSmartContractButton } from "./deploy-smart-contract-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

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

export const EscrowAgreements = (props: EscrowListProps) => {
  const { agreements, loading, error, refresh } = useEscrowAgreements(props);
  const supabase = createSupabaseBrowserClient();
  const hiddenFileInput = useRef<HTMLInputElement>(null);  
  const [uploading, setUploading] = useState(false);

  const updateEscrowAgreements = useCallback(async (payload: RealtimePostgresUpdatePayload<Record<string, string>>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get the id of users involved in the agreement from their wallets
    const { data: agreementUsers, error: agreementUsersError } = await supabase
      .from("escrow_agreements")
      .select(`
        beneficiary_wallet_id,
        depositor_wallet_id,
        beneficiary_wallet:wallets!beneficiary_wallet_id(profile_id),
        depositor_wallet:wallets!depositor_wallet_id(profile_id)
      `)
      .eq("transaction_id", payload.old.id)
      .single();

    if (agreementUsersError) {
      console.error("Could not find users involved in the given agreement", agreementUsersError);
      return;
    }

    const userIds = [
      agreementUsers.beneficiary_wallet,
      agreementUsers.depositor_wallet
    ];

    const formattedUserIds = userIds
      .flat()
      .map(wallet => wallet.profile_id);

    // Get the auth_user_id of users involved in the agreement from their id's
    const { data: foundUsers, error: foundUsersError } = await supabase
      .from("profiles")
      .select("auth_user_id")
      .in("id", formattedUserIds);

    if (foundUsersError) {
      console.error("Could not find auth_user_id's with the given user id's", foundUsersError);
      return;
    }

    const formattedAuthUserIds = foundUsers.map(foundUser => foundUser.auth_user_id);
    const isUserInvolvedInAgreement = formattedAuthUserIds.includes(user?.id);

    if (!isUserInvolvedInAgreement) return;

    const smartContractDeploymentStatus = payload.new.status

    console.log("Escrow agreement status update:", smartContractDeploymentStatus);
    toast.info(`Escrow agreement status update: ${smartContractDeploymentStatus}`);

    const shouldRefresh = smartContractDeploymentStatus === "PENDING";

    if (shouldRefresh) {
      refresh();
    }

    const isSmartContractDeployed = smartContractDeploymentStatus === "CONFIRMED";

    if (!isSmartContractDeployed) return;

    const { error: agreementStatusUpdateError } = await supabase
      .from("escrow_agreements")
      .update({ status: "OPEN" })
      .eq("transaction_id", payload.old.id);

    if (agreementStatusUpdateError) {
      console.error("Could not update smart contract status", agreementStatusUpdateError);
      return;
    }

    refresh();
  }, [supabase, refresh]);

  useEffect(() => {
    const subscription = supabase
      .channel("transactions")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "transactions"
      }, updateEscrowAgreements)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }
  }, [supabase, updateEscrowAgreements]);

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) return;

    setUploading(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const formData = new FormData();
    formData.append("file", files[0]);
    event.target.value = "";

    try {
      const response = await fetch(`${baseUrl}/api/contracts/validateWork`, {
        method: "POST",
        body: formData,
      });

      const parsedResponse = await response.json();

      if (parsedResponse.error) {
        return toast("Failed work validation", {
          description: parsedResponse.error
        });
      }

      toast("Successful work validation", {
        description: parsedResponse.message
      });
    } catch (error) {
      console.error("Error during image upload:", error);
    } finally {
      setUploading(false);
    }
  };

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
  }  

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
                      {agreement.depositor_wallet?.profiles.name ||
                        agreement.beneficiary_wallet?.profiles.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(agreement.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                        agreement.status as AgreementStatus
                      )}`}
                    >
                      {agreement.status}
                    </span>
                  </div>
                </div>
                <div>
                  <CreateSmartContractButton
                    depositorAddress={
                      agreement.depositor_wallet?.wallet_address
                    }
                    beneficiaryAddress={
                      agreement.beneficiary_wallet?.wallet_address
                    }                    
                    amountUSDC={
                      agreement.terms.amounts &&
                      parseFloat(
                        agreement.terms.amounts[0]?.amount.replace(/[$,]/g, "")
                      )
                    }
                    onSuccess={() => {
                      console.log("Success");
                    }}
                  />
                </div>
                {agreement.terms.documentUrl && (
                  <a
                    href={agreement.terms.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90 mt-3"
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
