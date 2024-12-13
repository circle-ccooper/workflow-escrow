import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EscrowAgreementItem } from "./escrow-agreements-item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EscrowAgreementWithDetails } from "@/types/escrow";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 5;

interface EscrowAgreementsTableProps {
  agreements: EscrowAgreementWithDetails[];
  loading?: boolean;
  error?: string | null;
  profileId: string;
  userId: string;
  refresh: () => void;
}

interface TabData {
  value: string;
  label: string;
  statuses: string[];
}

const tabs: TabData[] = [
  {
    value: "inProgress",
    label: "In Progress",
    statuses: ["INITIATED", "OPEN", "LOCKED", "PENDING"],
  },
  {
    value: "closed",
    label: "Closed",
    statuses: ["CLOSED"],
  },
];

export const EscrowAgreementsTable = (props: EscrowAgreementsTableProps) => {
  const { agreements, loading, error, refresh } = props;
  const [activeTab, setActiveTab] = useState("inProgress");
  const [selectedAgreement, setSelectedAgreement] =
    useState<EscrowAgreementWithDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [depositing, setDepositing] = useState<string | undefined>(undefined);

  const filteredAgreements = agreements.filter(
    (agreement: EscrowAgreementWithDetails) => {
      const currentTabData = tabs.find((tab) => tab.value === activeTab);
      return currentTabData?.statuses.includes(agreement.status) || false;
    }
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredAgreements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAgreements = filteredAgreements.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleRowClick = (agreement: EscrowAgreementWithDetails) => {
    setSelectedAgreement(
      selectedAgreement?.id === agreement.id ? null : agreement
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSelectedAgreement(null);
  };

  if (error) {
    return (
      <Card className="w-full">
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
    <>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-12" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Deliverables</TableHead>
                        <TableHead>Date Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAgreements.map((agreement) => (
                        <React.Fragment key={agreement.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRowClick(agreement)}
                          >
                            {/* TODO, add company name */}
                            {/* <TableCell>{agreement.terms?.company || 'N/A'}</TableCell> */}
                            <TableCell>{"N/A"}</TableCell>
                            <TableCell>
                              {agreement.beneficiary_wallet?.profiles?.name ||
                                "N/A"}
                            </TableCell>
                            <TableCell>{agreement.status}</TableCell>
                            <TableCell>
                              {agreement.terms?.amounts?.[0]?.amount || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {agreement.terms?.tasks?.[0]?.description ||
                                "N/A"}
                            </TableCell>
                            <TableCell>
                              {new Date(agreement.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                          {selectedAgreement?.id === agreement.id && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/50">
                                <EscrowAgreementItem
                                  agreement={agreement}
                                  profileId={props.profileId}
                                  userId={props.userId}
                                  depositing={depositing}
                                  refresh={async () => refresh()}
                                  preApproveCallback={() =>
                                    setDepositing(agreement.id)
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((prev) => Math.max(1, prev - 1));
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {/* First page */}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                          }}
                          isActive={currentPage === 1}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>

                      {/* Show ellipsis if there are many pages */}
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Current page and surrounding pages */}
                      {currentPage > 2 && currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(currentPage);
                            }}
                            isActive={true}
                          >
                            {currentPage}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Show ellipsis if there are many pages */}
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Last page */}
                      {totalPages > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(totalPages);
                            }}
                            isActive={currentPage === totalPages}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            );
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
};

export default EscrowAgreementsTable;
