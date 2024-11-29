import type { SmartContractResponse } from "@/app/hooks/useSmartContract";
import { useRef, useState } from "react";
import { FileText, ExternalLink, CircleDollarSign, Loader2, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AgreementStatus, EscrowAgreementWithDetails } from "@/types/escrow";
import { getStatusColor } from "@/lib/utils/escrow";
import { CreateSmartContractButton } from "@/components/deploy-smart-contract-button";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface EscrowAgreementCardProps {
  agreement: EscrowAgreementWithDetails;
  profileId: string;
  userId: string;
  depositing?: string;
  refresh: () => Promise<void>;
  preApproveCallback: () => void;
}

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

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : "http://localhost:3000";

export const EscrowAgreementItem: React.FC<EscrowAgreementCardProps> = ({
  agreement,
  profileId,
  userId,
  depositing,
  refresh,
  preApproveCallback
}) => {
  const supabase = createSupabaseBrowserClient();
  const [submittingWork, setSubmittingWork] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitWork = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const submitWork = async (
    event: React.ChangeEvent<HTMLInputElement>,
    circleContractId: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubmittingWork(circleContractId);
      try {
        const formData = new FormData();
        formData.append("circleContractId", circleContractId)
        formData.append("file", file);

        const response = await fetch(
          `${baseUrl}/api/contracts/validate-work`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast.success(result.message || "Work submitted successfully");
          refresh();
        } else {
          toast.error(result.error || "Failed to submit work");
        }
      } catch (error) {
        console.error("Error submitting work:", error);
        toast.error("An error occurred while submitting the work");
      } finally {
        setSubmittingWork(undefined);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const approveDeposit = async (agreement: EscrowAgreementWithDetails) => {
    preApproveCallback();

    const approveResponse = await fetch(`${baseUrl}/api/contracts/escrow/deposit/approve`, {
      method: "POST",
      body: JSON.stringify({
        circleContractId: agreement.circle_contract_id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const parsedApproveResponse = await approveResponse.json();

    if (parsedApproveResponse.error) {
      console.error("Failed to approve funds deposit:", parsedApproveResponse.error);
      toast.error("Failed to approve funds deposit", {
        description: parsedApproveResponse.error
      })
    }

    await supabase
      .from("escrow_agreements")
      .update({ status: "PENDING" })
      .eq("id", agreement.id);

    refresh();

    toast.info(parsedApproveResponse.message);
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

    // Update circle_transaction_id (is "NULL" by default on creation)
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

  return (
    <div key={agreement.id} className="rounded-lg border p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">
            Agreement with{" "}
            {profileId === agreement.depositor_wallet?.profile_id
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
        {(userId === agreement.depositor_wallet?.profiles?.auth_user_id && agreement.status === "INITIATED") && (
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
        {(userId === agreement.depositor_wallet?.profiles?.auth_user_id && agreement.status === "OPEN") && (
          <Button disabled={depositing === agreement.id} onClick={() => approveDeposit(agreement)}>
            {depositing === agreement.id ? (
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
        {(userId === agreement.beneficiary_wallet?.profiles?.auth_user_id && agreement.status === "LOCKED") && (
          <>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={event => submitWork(event, agreement.circle_contract_id)}
            />
            <Button disabled={submittingWork !== undefined} onClick={handleSubmitWork}>
              {submittingWork === agreement.circle_contract_id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageUp className="mr-2 h-4 w-4" />
                  Submit work
                </>
              )}
            </Button>
          </>
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
  );
};
