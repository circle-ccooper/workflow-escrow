"use client";

import { useWalletBalance } from "@/app/hooks/useWalletBalance";
import { Skeleton } from "./ui/skeleton";
import { RotateCw } from "lucide-react";
import { Button } from "./ui/button";


interface WalletBalanceProps {
  walletId: string;
}

export function WalletBalance({ walletId }: WalletBalanceProps) {
  const { balance, loading, refreshBalance } = useWalletBalance(walletId);

  if (loading) {
    return <Skeleton className="w-[103px] h-[28px] rounded-full" />;
  }

  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <div className="flex items-center justify-between">
      <p
        className="text-xl text-muted-foreground cursor-pointer mb-4"
      >
        {formattedBalance} USDC
      </p>
      <Button className="mb-4" variant="ghost" size="icon" onClick={refreshBalance} >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
}