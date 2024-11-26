"use client";

import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect, useState, useMemo, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

interface WalletBalanceProps {
  walletId: string;
}

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://127.0.0.1:3000";

export function WalletBalance({ walletId }: WalletBalanceProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    const balanceResponse = await fetch(`${baseUrl}/api/wallet/balance`, {
      method: "POST",
      body: JSON.stringify({ walletId, }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const parsedBalance = await balanceResponse.json();

    if (parsedBalance.error) {
      console.error("Error fetching wallet balance:", parsedBalance.error);
      toast.error("Error fetching wallet balance", {
        description: parsedBalance.error
      });
      setLoading(false);
      return;
    }

    if (parsedBalance.balance === null || parsedBalance.balance === undefined) {
      console.log("Wallet has no balance");
      toast.info("Wallet has no balance");
      setBalance(0);
      setLoading(false);
      return;
    }

    setLoading(false);
    setBalance(parsedBalance.balance);
  }

  const updateWalletBalance = useCallback((payload: RealtimePostgresUpdatePayload<Record<string, string>>, balance: number) => {
    const stringifiedBalance = balance.toString()
    const shouldUpdateBalance = payload.new.balance !== stringifiedBalance;

    if (shouldUpdateBalance) {
      toast.info("Wallet balance updated");
      setBalance(Number(payload.new.balance));
    }
  }, [supabase]);

  useEffect(() => {
    fetchBalance()
  }, []);

  useEffect(() => {
    const walletSubscription = supabase
      .channel("wallet")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `circle_wallet_id=eq.${walletId}`,
        },
        payload => updateWalletBalance(payload, balance)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletSubscription);
    };
  }, [supabase, walletId]);

  if (loading) {
    return <Skeleton className="w-[103px] h-[28px] rounded-full" />;
  }

  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <p className="text-xl text-muted-foreground cursor-pointer mb-4">
      {formattedBalance} USDC
    </p>
  );
}
