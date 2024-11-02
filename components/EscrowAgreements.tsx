"use client";

import { Loader2, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEscrowAgreements } from "@/hooks/useEscrowAgreements";
import { EscrowListProps } from "@/types/escrow";
import { getStatusColor, formatAmount } from "@/lib/utils/escrow";

export const EscrowAgreements = (props: EscrowListProps) => {
  const { agreements, loading, error, refresh } = useEscrowAgreements(props);

  if (loading) {
    return (
      <Card className="break-inside-avoid mb-4 w-full">
        <CardHeader>
          <CardTitle>Escrow Agreements</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
        <CardTitle>Escrow Agreements</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          className="h-8 w-8 p-0"
        >
          <Loader2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {agreements.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No agreements found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className="rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">
                      Agreement with{" "}
                      {agreement.beneficiary_wallet_id || "Unknown"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created {agreement.created_at}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                        agreement.status as any
                      )}`}
                    >
                      {agreement.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  {/* <p className="text-sm text-muted-foreground">
                    Amount: {formatAmount(agreement.transaction.amount, agreement.transaction.currency)}
                  </p> */}
                  {agreement.terms.documentUrl && (
                    <a
                      href={agreement.terms.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90 mt-2"
                    >
                      <FileText className="h-4 w-4" />
                      {agreement.terms.originalFileName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {agreement.terms.tasks?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Tasks ({agreement.terms.tasks.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {agreement.terms.tasks.map((task: any, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground"
                        >
                          • {task.task_description}
                          {task.due_date && (
                            <span className="ml-1 text-xs">
                              (Due: {task.due_date})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
