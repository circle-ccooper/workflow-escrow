import { useState } from "react";
import { toast } from "sonner";

import { createFileService } from "@/services/file.service";
import { createAgreementService } from "@/services/agreement.service";
import { CreateAgreementProps } from "@/types/agreements";
import { parseAmount } from "@/lib/utils/amount";
import { createClient } from "@/lib/utils/supabase/client";

export const useFileUpload = (props: CreateAgreementProps) => {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const fileService = createFileService(supabase);
  const agreementService = createAgreementService(supabase);

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

      // Analyze document
      const analysis = await fileService.analyzeDocument(file);

      if (!analysis.amounts?.length) {
        throw new Error("No amounts found in the document");
      }

      // Create transaction
      const amount = parseAmount(analysis.amounts[0].full_amount);
      const transaction = await agreementService.createTransaction({
        walletId: props.depositorWalletId,
        profileId: props.userProfileId,
        amount,
        description:
          analysis.amounts[0]?.payment_for || "Escrow agreement deposit",
      });

      // Create agreement
      const agreement = await agreementService.createAgreement({
        beneficiaryWalletId: props.beneficiaryWalletId,
        depositorWalletId: props.depositorWalletId,
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
        description: `Found ${analysis.amounts.length} amounts and ${analysis.tasks?.length || 0} tasks`,
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
          "An error occurred while processing the document. Please try again later.",
      });
    } finally {
      setUploading(false);
    }
  };

  return { handleFileUpload, uploading };
};
