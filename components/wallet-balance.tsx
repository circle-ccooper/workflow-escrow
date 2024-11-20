"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Skeleton } from "@/components/ui/skeleton";
import { syncWalletBalance } from "@/app/actions/sync-wallet-balance";

interface WalletBalanceProps {
  walletId: string;
}

export function WalletBalance({ walletId }: WalletBalanceProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        // First, sync with Circle API
        await syncWalletBalance(walletId);

        // Then fetch from database
        const { data } = await supabase
          .from("wallets")
          .select("balance")
          .eq("circle_wallet_id", walletId)
          .single();

        if (data) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch initial balance
    fetchBalance();

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchBalance, 30000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel("wallets")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `circle_wallet_id=eq.${walletId}`,
        },
        (payload) => {
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [supabase, walletId]);

  if (isLoading || balance === null) {
    return <Skeleton className="w-[56px] h-[28px] rounded-full" />;
  }

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(balance);

  return (
    <p className="text-xl text-muted-foreground cursor-pointer mb-4">
      {formattedBalance}
    </p>
  );
}
