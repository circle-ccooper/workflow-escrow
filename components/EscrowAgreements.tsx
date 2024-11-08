"use client";

import { useRef, useState } from "react";
import { FileText, ExternalLink, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEscrowAgreements } from "@/app/hooks/useEscrowAgreements";
import { EscrowListProps, AgreementStatus } from "@/types/escrow";
import { getStatusColor } from "@/lib/utils/escrow";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://127.0.0.1:3000";

export const EscrowAgreements = (props: EscrowListProps) => {
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const { agreements, loading, error, refresh } = useEscrowAgreements(props);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) return;

    setUploading(true);

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
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className="rounded-lg border p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">
                      Agreement with{" "}
                      {agreement.depositor_wallet?.profiles.name || agreement.beneficiary_wallet.profiles.name}
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
                {agreement.terms.amounts?.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mt-3">
                      Amounts ({agreement.terms.amounts.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {agreement.terms.amounts.map(
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
                {agreement.terms.tasks?.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mt-3">
                      Tasks ({agreement.terms.tasks.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {agreement.terms.tasks.map(
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
                {!agreement.depositor_wallet?.profiles.name && (
                  <>
                    <input
                      ref={hiddenFileInput}
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      hidden
                    />
                    <Button className="mt-3" onClick={handleClick} disabled={uploading}>
                      {uploading ? "Uploading..." : "Submit work"}
                    </Button>
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
