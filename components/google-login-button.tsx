"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";

const supabase = createSupabaseBrowserClient();

export const GoogleLoginButton = (props: { nextUrl?: string }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${
          props.nextUrl || "/"
        }`,
      },
    });
  };

  return (
    <Button disabled={loading} className="w-full" variant="outline" onClick={handleLogin}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : "Sign in with Google"}
    </Button>
  );
}