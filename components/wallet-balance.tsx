"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletBalanceProps {
  walletId: string;
}

export function WalletBalance({ walletId }: WalletBalanceProps) {
  const supabase = createSupabaseBrowserClient();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("circle_wallet_id", walletId)
        .single();

      if (data) {
        setBalance(data.balance);
      }
    };

    // Fetch initial balance
    fetchBalance();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("wallets")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallets", filter: `circle_wallet_id=eq.${walletId}` },
        (payload) => {
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, walletId]);

  if (balance === null) {
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
