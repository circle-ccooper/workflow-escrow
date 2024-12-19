'use client';

import Link from 'next/link';
import { MailCheck } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 flex flex-col min-w-64">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-600">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Already confirmed?{' '}
          <Link
            className="text-blue-600 hover:text-blue-500 transition-colors font-medium"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>

        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="rounded-full bg-blue-50 p-3">
            <MailCheck className="h-8 w-8 text-blue-600" />
          </div>
          
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              We've sent you a confirmation email. Please check your inbox 
              and click the verification link to complete your registration.
            </p>
            
            <p className="text-sm text-muted-foreground">
              If you don't see the email, check your spam folder or{' '}
              <Link 
                href="/sign-up" 
                className="text-blue-600 hover:text-blue-500 transition-colors font-medium"
              >
                try signing up again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}