"use client"

import { ChangeEventHandler, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

const sleep = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

export const UploadContractButton = () => {
  const [uploading, setUploading] = useState(false);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const MAX_FILE_SIZE_5MB = 5 * 1024 * 1024;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

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

    try {
      // TODO: Remove this after prototyping phase
      await sleep(1500);
      const uploadError = Math.random() >= 0.5;

      if (uploadError) {
        toast.error("Upload failed", {
          description: `Could not upload contract: Unknown error`,
        });

        if (hiddenFileInput.current) {
          hiddenFileInput.current.value = "";
        }

        return;
      }

      toast.success("Upload successful!", {
        description: "Your contract has been uploaded",
      });
    } catch (error) {
      console.error("Unexpected upload error:", error);
      toast.error("Unexpected error", {
        description: "There was an unexpected error uploading your contract. Please try again.",
      });

      if (hiddenFileInput.current) {
        hiddenFileInput.current.value = "";
      }
    } finally {
      setUploading(false);
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
      <Button disabled={uploading} onClick={handleClick}>
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp />}
        &nbsp;
        {uploading ? "Uploading" : "Upload contract"}
      </Button>
    </>
  );
};
