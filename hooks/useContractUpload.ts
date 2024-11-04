import { useState } from "react";
import { toast } from "sonner";

import { createFileService } from "@/services/file.service";
import { createAgreementService } from "@/services/agreement.service";
import { CreateAgreementProps } from "@/types/agreements";
import { createClient } from "@/lib/utils/supabase/client";

interface Amount {
  amount: string;
  full_amount: string;
  payment_for: string;
  location: string;
}

interface Task {
  task_description: string;
  due_date: string | null;
  responsible_party: string;
  additional_details: string;
}

interface DocumentAnalysis {
  amounts: Amount[];
  tasks: Task[];
}

// Updated amount parser to handle the new format
const parseAmount = (amountStr: string): number => {
  if (!amountStr) {
    throw new Error("No amount provided");
  }

  const cleanAmount = amountStr
    .replace(/[()]/g, "")
    .replace(/[$€£,\s]/g, "")
    .replace(/−/g, "-");

  const amount = parseFloat(cleanAmount);

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  return amount;
};

export const useContractUpload = (props: CreateAgreementProps) => {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const fileService = createFileService(supabase);
  const agreementService = createAgreementService(supabase);

  const analyzeDocument = async (file: File): Promise<DocumentAnalysis> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/contracts/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to analyze document");
    }

    return response.json();
  };

  const handleFileUpload = async (file: File) => {
    if (!props.beneficiaryWalletId) {
      toast.error("Missing beneficiary", {
        description: "Please select a beneficiary before uploading a contract",
      });
      return;
    }

    let tempPath: string | null = null;
    const toastId = toast.loading("Processing document...");
    setUploading(true);

    try {
      fileService.validateFile(file);

      // Upload to temp location
      tempPath = await fileService.uploadToTemp(file, props.userId);

      // Analyze document using the new API
      const analysis = await analyzeDocument(file);

      if (!analysis.amounts?.length) {
        throw new Error("No amounts found in the document");
      }

      // Create transaction with the new amount format
      const amount = parseAmount(analysis.amounts[0].amount);
      const transaction = await agreementService.createTransaction({
        walletId: props.depositorWalletId!,
        profileId: props.userProfileId!,
        amount,
        description:
          analysis.amounts[0]?.payment_for || "Escrow agreement deposit",
      });

      // Create agreement
      const agreement = await agreementService.createAgreement({
        beneficiaryWalletId: props.beneficiaryWalletId,
        depositorWalletId: props.depositorWalletId!,
        transactionId: transaction.id,
        terms: {
          ...analysis,
          originalFileName: file.name,
        },
      });

      // Move file to final location
      const finalPath = await fileService.downloadAndUploadToFinal(
        tempPath,
        file,
        agreement.id
      );

      // Cleanup temp file
      await fileService.deleteTempFile(tempPath);

      // Get public URL and update agreement
      const signedUrl = await fileService.getSignedUrl(finalPath);
      await agreementService.updateAgreementTerms(agreement.id, {
        ...analysis,
        documentUrl: signedUrl,
        originalFileName: file.name,
      });

      toast.success("Document processed successfully", {
        id: toastId,
        description: `Found ${analysis.amounts.length} amounts and ${
          analysis.tasks?.length || 0
        } tasks`,
      });

      props.onAnalysisComplete?.(analysis, {
        ...agreement,
        terms: {
          ...analysis,
          documentUrl: signedUrl,
          originalFileName: file.name,
        },
      });

      return { analysis, agreement };
    } catch (error) {
      console.error("Process error:", error);

      if (tempPath) {
        try {
          await fileService.deleteTempFile(tempPath);
        } catch (deleteError) {
          console.error("Failed to delete temporary file:", deleteError);
        }
      }

      toast.error("Process failed", {
        id: toastId,
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while processing the document. Please try again later.",
      });
    } finally {
      setUploading(false);
    }
  };

  return { handleFileUpload, uploading };
};
