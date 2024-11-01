"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";

export const GoogleLoginButton = (props: { nextUrl?: string }) => {
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${
          props.nextUrl || ""
        }`,
      },
    });
  };

  return (
    <Button className="w-full" variant="outline" onClick={handleLogin}>
      Sign in with Google
    </Button>
  );
}