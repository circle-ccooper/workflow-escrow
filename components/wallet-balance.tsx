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
        // Initial sync with Circle API
        await syncWalletBalance(walletId);

        // Fetch from database
        const { data, error } = await supabase
          .from("wallets")
          .select("balance")
          .eq("circle_wallet_id", walletId)
          .single();

        if (error) throw error;
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`wallet-${walletId}`) // Unique channel name per wallet
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `circle_wallet_id=eq.${walletId}`,
        },
        (payload) => {
          if (payload.new.balance !== balance) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for wallet ${walletId}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, walletId, balance]);

  if (isLoading || balance === null) {
    return <Skeleton className="w-[56px] h-[28px] rounded-full" />;
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
