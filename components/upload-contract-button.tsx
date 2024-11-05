"use client";

import { useRef } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateAgreementProps } from "@/types/agreements";
import { useContractUpload } from "@/hooks/useContractUpload";

export const UploadContractButton = (props: CreateAgreementProps) => {
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const { handleFileUpload, uploading } = useContractUpload(props);

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
