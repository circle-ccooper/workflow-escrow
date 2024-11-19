'use server'

import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import { revalidatePath } from "next/cache";

const baseUrl = process.env.VERCEL_URL
  ? process.env.VERCEL_URL
  : "http://127.0.0.1:3000";

export async function syncWalletBalance(circleWalletId: string) {
  try {
    const supabase = createSupabaseServerComponentClient();

    // 1. Fetch balance from Circle API
    const balanceResponse = await fetch(
      `${baseUrl}/api/wallet/balance`,
      {
        method: "POST",
        body: JSON.stringify({
          walletId: circleWalletId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const parsedBalance = await balanceResponse.json();
    
    if (parsedBalance.error || !parsedBalance.balance) {
      console.error('Error fetching balance:', parsedBalance.error);
      return { error: parsedBalance.error || 'Failed to fetch balance' };
    }

    // 2. Update the wallet balance in the database
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: parsedBalance.balance,
        updated_at: new Date().toISOString()
      })
      .eq('circle_wallet_id', circleWalletId);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return { error: 'Failed to update balance' };
    }

    // Revalidate the page to trigger a refresh
    revalidatePath('/');
    
    return { balance: parsedBalance.balance };
  } catch (error) {
    console.error('Error in syncWalletBalance:', error);
    return { error: 'Internal server error' };
  }
}