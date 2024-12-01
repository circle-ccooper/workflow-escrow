"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type FunctionComponent, useState } from "react";
import { toast } from "sonner";

interface Props {
  walletAddress: string;
}

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : "http://localhost:3000";

export const RequestUsdcButton: FunctionComponent<Props> = ({ walletAddress }) => {
  const [requesting, setRequesting] = useState(false);

  const requestFaucetUsdc = async () => {
    try {
      setRequesting(true);

      const response = await fetch(`${baseUrl}/api/wallet/balance/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress })
      });

      setRequesting(false);

      const parsedResponse = await response.json();

      if (parsedResponse.error) {
        console.error(parsedResponse.error);
        toast.error(parsedResponse.error);
      }

      toast.success(parsedResponse.message);
    } catch (error) {
      console.error("Failed to request USDC via faucet", error);
      toast.error("Failed to request USDC via faucet");
    }
  }

  return (
    <Button disabled={requesting} onClick={requestFaucetUsdc}>
      {requesting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : "Request 20 USDC via Faucet"}
    </Button>
  )
}