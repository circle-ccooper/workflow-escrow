"use client";

import { type FunctionComponent, type HTMLProps, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props extends HTMLProps<HTMLElement> {
  mode: "BUY" | "SELL";
  walletAddress: string;
}

export const USDCButton: FunctionComponent<Props> = ({ mode, walletAddress, className }) => {
  const [loading, setLoading] = useState(false);

  const redirectToRamp = async () => {
    setLoading(true);

    const usdcAccessResponse = await fetch(`/api/usdc/${mode.toLowerCase()}`, {
      method: "POST",
      body: JSON.stringify({
        wallet_address: walletAddress
      })
    });

    setLoading(false);

    const parsedUsdcAccessResponse = await usdcAccessResponse.json();
    window.open(parsedUsdcAccessResponse.url, "popup", "width=500,height=600");
  }

  return (
    <Button className={className} disabled={loading} onClick={redirectToRamp}>
      {loading
        ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        )
        : mode === "BUY" ? "Deposit" : "Withdraw"}
    </Button>
  )
}