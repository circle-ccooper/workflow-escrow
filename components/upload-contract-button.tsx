"use client"

import { ChangeEventHandler, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_5MB = 5 * 1024 * 1024;

interface DocumentAnalysis {
  amounts: Array<{
    full_amount: string;
    payment_for: string;
    location: string;
  }>;
  tasks: Array<{
    task_description: string;
    due_date: string | null;
    responsible_party: string;
    additional_details: string;
  }>;
}

interface CreateAgreementProps {
  beneficiaryWalletId?: string;
  onAnalysisComplete?: (analysis: DocumentAnalysis) => void;
}

export const UploadContractButton = ({
  beneficiaryWalletId,
  onAnalysisComplete
}: CreateAgreementProps) => {
  const [uploading, setUploading] = useState(false);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!beneficiaryWalletId) {
      toast.error("Missing beneficiary", {
        description: "Please select a beneficiary before uploading a contract",
      });
      return;
    }

    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Only PDF and DOCX contracts are allowed",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_5MB) {
      toast.error("Contract too large", {
        description: "Please upload a contract smaller than 5 MB",
      });
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      // Create form data with file
      const formData = new FormData();
      formData.append("file", file);

      // Send to gatherDocumentInfo endpoint
      const response = await fetch("/api/contracts/gatherDocumentInfo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to process document");
      }

      // Get the analysis result
      const analysis: DocumentAnalysis = await response.json();

      // Show some stats in the success message
      const amountsCount = analysis.amounts.length;
      const tasksCount = analysis.tasks.length;

      toast.success("Document analyzed successfully", {
        id: toastId,
        description: `Found ${amountsCount} amounts and ${tasksCount} tasks`,
      });

      // Call the callback with the analysis results
      onAnalysisComplete && onAnalysisComplete(analysis);

      return analysis;

    } catch (error) {
      console.error("Process error:", error);

      toast.error("Process failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });

    } finally {
      setUploading(false);
      if (hiddenFileInput.current) {
        hiddenFileInput.current.value = "";
      }
    }
  };

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = event => {
    const files = event.target.files;
    if (files) handleFileUpload(files[0]);
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
      <Button disabled={uploading || !beneficiaryWalletId} onClick={handleClick}>
        {uploading ? (
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

// // Usage example:
// export const CreateAgreementPage = () => {
//   const handleAnalysisComplete = (analysis: DocumentAnalysis) => {
//     console.log("Contract Analysis:", analysis);
//     // Handle the analysis results (e.g., display them, save to state, etc.)
//   };
//
//   return (
//     <div className="space-y-6 max-w-2xl mx-auto p-4">
//       <h1 className="text-2xl font-semibold">Create New Agreement</h1>
//
//       <div className="bg-white rounded-lg shadow p-6 space-y-4">
//         {/* Beneficiary selection goes here */}
//
//         <div className="pt-4 border-t border-gray-200">
//           <UploadContractButton
//             beneficiaryWalletId={selectedBeneficiary}
//             onAnalysisComplete={handleAnalysisComplete}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };