"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateAgreementProps } from "@/types/agreements";
import { useContractUpload } from "@/app/hooks/useContractUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Task {
  description: string;
}

interface Amount {
  amount: string;
  for: string;
}

export const UploadContractButton = (props: CreateAgreementProps) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [analyzingDocument, setAnalyzingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [contractAmounts, setContractAmounts] = useState<Amount[]>([]);
  const [contractTerms, setContractTerms] = useState<string[]>([]);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const { handleFileUpload, analyzeDocument, uploading } = useContractUpload({
    ...props
  });

  const openFilePicker = () => {
    hiddenFileInput.current?.click();
  };

  const closeAlertDialog = () => setConfirmationDialogOpen(false);

  const uploadDocument = async () => {
    try {
      if (!selectedFile) {
        throw new Error("No file selected");
      }

      await handleFileUpload(selectedFile);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error uploading document", {
        description: error instanceof Error
          ? error.message
          : "An error occurred while uploading the document. Please try again later.",
      });
    }

    closeAlertDialog();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      setSelectedFile(files[0]);

      setAnalyzingDocument(true);

      const document = await analyzeDocument(files[0]) as unknown as { amounts: Amount[], tasks: Task[] };
      setContractAmounts(document.amounts);

      setAnalyzingDocument(false);

      const contractTasks = document.tasks.map(task => task.description);

      setContractTerms(contractTasks);
      setConfirmationDialogOpen(true);

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
        disabled={analyzingDocument || !props.beneficiaryWalletId}
        onClick={openFilePicker}
      >
        {analyzingDocument ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing document...
          </>
        ) : (
          <>
            <FileUp className="mr-2 h-4 w-4" />
            Upload contract
          </>
        )}
      </Button>
      <AlertDialog open={confirmationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review contract terms</AlertDialogTitle>
            <AlertDialogDescription>
              Before proceeding, check the uploaded contract terms below to ensure everything is correct.
            </AlertDialogDescription>
            <span className="text-sm text-muted-foreground font-bold">Amounts:</span>
            <ul className="my-6 ml-6 list-disc text-sm text-muted-foreground [&>li]:mt-2 [&>li:first-child]:mt-0">
              {contractAmounts.map((contractAmount, index) => (
                <li key={index}>
                  <b>{contractAmount.amount}</b>: {contractAmount.for}
                </li>
              ))}
            </ul>
            <span className="text-sm text-muted-foreground font-bold">Tasks:</span>
            <ul className="my-6 ml-6 list-disc text-sm text-muted-foreground [&>li]:mt-2 [&>li:first-child]:mt-0">
              {contractTerms.map((contractTerm, index) => (
                <li key={index}>
                  {contractTerm}
                </li>
              ))}
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAlertDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={uploading} onClick={uploadDocument}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading document...
                </>
              ) : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
