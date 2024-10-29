"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  try {
    const createdWalletSetResponse = await fetch(`${baseUrl}/api/wallet-set`, {
      method: "PUT",
      body: JSON.stringify({
        entityName: email
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const createdWalletSet = await createdWalletSetResponse.json();

    const createdWalletResponse = await fetch(`${baseUrl}/api/wallet`, {
      method: "PUT",
      body: JSON.stringify({
        walletSetId: createdWalletSet.id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const createdWallet = await createdWalletResponse.json();

    const userResult = await supabase
      .schema("public")
      .from("users")
      .insert({
        email,
        name: "User"
      })
      .select();

    if (userResult.error) {
      console.error("Error while attempting to create user:", userResult.error);
      return { error: "Could not create user" }
    }

    const [createdUser] = userResult.data;

    const walletResult = await supabase
      .schema("public")
      .from("wallets")
      .insert({
        user_id: createdUser.id,
        circle_wallet_id: createdWallet.id,
        wallet_type: createdWallet.custodyType,
        currency: "USDC"
      })
      .select();

    if (walletResult.error) {
      console.error("Error while attempting to create user's wallet:", walletResult.error);
      return { error: "Could not create wallet" }
    }
  } catch (error: any) {
    console.error(error.message);
    return { error: error.message };
  }

  return redirect("/protected")
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
