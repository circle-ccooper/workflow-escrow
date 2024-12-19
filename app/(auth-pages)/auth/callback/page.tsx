'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const handleAuthCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        const handleSession = async () => {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (mounted) {
            if (session) {
              await router.push('/dashboard');
            } else {
              await router.push('/auth/sign-in');
            }
          }
        };

        if (token && type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) throw error;
          await handleSession();
        } else {
          await handleSession();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        console.error('Authentication error:', error);
        if (mounted) {
          await router.push(`/auth/sign-in?error=${encodeURIComponent(errorMessage)}`);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    handleAuthCallback();
    return () => {
      mounted = false;
    };
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