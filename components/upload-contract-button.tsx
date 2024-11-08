"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateAgreementProps } from "@/types/agreements";
import { useContractUpload } from "@/app/hooks/useContractUpload";
import { createClient } from "@/lib/utils/supabase/client";
import { toast } from "sonner";

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://127.0.0.1:3000";

export const UploadContractButton = (props: CreateAgreementProps) => {
  const [initializingContract, setInitializingContract] = useState(false);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const onAnalysisComplete = async (_: unknown, agreement: { id: string }) => {
    try {
      const { data: wallets, error } = await supabase
        .from("wallets")
        .select("id, wallet_address")
        .in("id", [props.depositorWalletId, props.beneficiaryWalletId]);

      if (error) {
        console.error("Error fetching wallets:", error);
        return;
      }

      const depositor = wallets.find(
        (wallet) => wallet.id === props.depositorWalletId
      );

      const beneficiary = wallets.find(
        (wallet) => wallet.id === props.beneficiaryWalletId
      );

      const toastId = toast.loading("Initializing escrow contract...");
      setInitializingContract(true);

      const response = await fetch(`${baseUrl}/api/contracts/escrow`, {
        method: "POST",
        body: JSON.stringify({
          depositorAddress: depositor?.wallet_address,
          beneficiaryAddress: beneficiary?.wallet_address,
          agentAddress: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
          // Used for testing purposes
          agentWalletId: "a177f8f6-a55d-5f4f-aa1f-16554ec03b77",
          amountUSDC: 1,
        }),
      });

      setInitializingContract(false);

      const parsedResponse = await response.json();

      if (parsedResponse.error) {
        console.error(
          "Escrow contract creation failed:",
          parsedResponse.error
        );
        toast.error("Escrow contract creation failed", {
          id: toastId,
          description: parsedResponse.error,
        });

        return;
      }

      const { data: transaction, error: transactionError } = await supabase
        .from("escrow_agreements")
        .select("transaction_id")
        .eq("id", agreement.id)
        .single();

      if (transactionError) {
        console.error("Could not get transaction ID", transactionError);
        return;
      }

      // Update circle_transaction_id (is "PENDING" by default on creation)
      // This is needed so we can find the transaction later on and update it's status
      await supabase
        .from("transactions")
        .update({ circle_transaction_id: parsedResponse.transactionId })
        .eq("id", transaction.transaction_id);

      console.log("Escrow contract creation initialized:", parsedResponse);
      toast.success("Escrow contract creation initialized", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error initializing escrow contract:", error);
    }
  };

  const { handleFileUpload, uploading } = useContractUpload({
    ...props,
    onAnalysisComplete,
  });

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files[0]);
      event.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={hiddenFileInput}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        hidden
      />
      <Button
        disabled={uploading || !props.beneficiaryWalletId}
        onClick={handleClick}
      >
        {uploading || initializingContract ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <FileUp className="mr-2 h-4 w-4" />
            Upload contract
          </>
        )}
      </Button>
    </>
  );
};
