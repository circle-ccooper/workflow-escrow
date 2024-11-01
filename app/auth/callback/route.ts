import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");

  const nextUrl = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`http://127.0.0.1:3000/${nextUrl}`);
    }
  }

  return NextResponse.redirect(`http://127.0.0.1:3000/auth/auth-error`);
}