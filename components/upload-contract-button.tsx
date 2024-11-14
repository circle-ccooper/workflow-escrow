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

interface Task {
  description: string;
  due_date: string | null;
  responsible_party: string;
  additional_details: string;
}

export const UploadContractButton = (props: CreateAgreementProps) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [analyzingDocument, setAnalyzingDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<File>();
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
    if (!selectedDocument) return;

    await handleFileUpload(selectedDocument);

    closeAlertDialog();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      setSelectedDocument(files[0]);

      setAnalyzingDocument(true);
      const document = await analyzeDocument(files[0]);
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
            <ul className="my-6 ml-6 list-disc text-sm text-muted-foreground [&>li]:mt-2">
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
