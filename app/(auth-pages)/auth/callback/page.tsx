'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (token && type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) {
            throw error;
          }

          // Check session after verification
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            router.push('/dashboard');
          } else {
            router.push('/auth/sign-in');
          }
        } else {
          // Handle general auth callback
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            router.push('/dashboard');
          } else {
            router.push('/auth/sign-in');
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/auth/sign-in?error=Authentication failed');
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Verifying your account...</h2>
          <p className="mt-2 text-gray-600">Please wait while we complete the verification process.</p>
        </div>
      </div>
    </div>
  );
}