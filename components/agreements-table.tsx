import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { EscrowAgreementItem } from "./escrow-agreements-item";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EscrowAgreementWithDetails } from '@/types/escrow';

const ITEMS_PER_PAGE = 5;

interface Agreement {
    id: string;
    status: string;
    terms?: {
        company?: string;
        amounts?: { amount: string }[];
        tasks?: { description: string }[];
    };
    beneficiary_wallet?: {
        profiles?: {
            name?: string;
        };
    };
    created_at: string;
    beneficiary_wallet_id: string;
    depositor_wallet_id: string;
    circle_contract_id: string; // Ensure this is always a string
    depositor_wallet?: {
        profile_id: string;
        wallet_address: string;
        profiles: {
            name: string;
            auth_user_id: string;
        };
    };
    circle_contract?: object;
    escrow_contract?: object;
    escrow_contract_id?: string;
    transaction?: object;
    transaction_id?: string;
    updated_at?: string;
    transactions?: object[];
}

interface EscrowAgreementsTableProps {
    agreements: EscrowAgreementWithDetails[];
    loading?: boolean;
    depositing?: string;
    error?: string | null;
    profileId: string;
    userId: string;
    refresh: () => void;
}

export const EscrowAgreementsTable = (props: EscrowAgreementsTableProps) => {
    const { agreements, loading, error, refresh } = props;
    const [activeTab, setActiveTab] = useState('inProgress');
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [depositing, setDepositing] = useState<string | undefined>(undefined);



    const filteredAgreements = agreements.filter((agreement: EscrowAgreementWithDetails) =>
        activeTab === 'inProgress'
            ? ['INITIATED', 'OPEN', 'LOCKED'].includes(agreement.status)
            : agreement.status === 'CLOSED'
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredAgreements.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedAgreements = filteredAgreements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleRowClick = (agreement: Agreement) => {
        setSelectedAgreement(selectedAgreement && selectedAgreement.id === agreement.id ? null : agreement);
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
            <div className="flex w-10 mb-2">
                <Button
                    variant={activeTab === 'inProgress' ? 'default' : 'secondary'}
                    className="rounded-r-none flex-1"
                    onClick={() => {
                        setActiveTab('inProgress');
                        setCurrentPage(1);
                        setSelectedAgreement(null);
                    }}
                >
                    In Progress
                </Button>
                <Button
                    variant={activeTab === 'closed' ? 'default' : 'secondary'}
                    className="rounded-l-none flex-1"
                    onClick={() => {
                        setActiveTab('closed');
                        setCurrentPage(1);
                        setSelectedAgreement(null);
                    }}
                >
                    Closed
                </Button>
            </div>

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
                                {paginatedAgreements.map((agreement: any) => (
                                    <React.Fragment key={agreement.id}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(agreement)}
                                        >
                                            <TableCell>{agreement.terms?.company || 'N/A'}</TableCell>
                                            <TableCell>{agreement.beneficiary_wallet?.profiles?.name || 'N/A'}</TableCell>
                                            <TableCell>{agreement.status}</TableCell>
                                            <TableCell>
                                                {agreement.terms?.amounts?.[0]?.amount || 'N/A'}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate">
                                                {agreement.terms?.tasks?.[0]?.description || 'N/A'}
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
                                                        preApproveCallback={() => setDepositing(agreement.id)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </>

    );
};

export default EscrowAgreementsTable;