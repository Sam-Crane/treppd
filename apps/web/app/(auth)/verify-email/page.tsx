'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { ResendCooldownButton } from '@/components/auth/resend-cooldown-button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Poll the session every 3 seconds in case the user clicks the link in
  // another tab — we can auto-advance them here too.
  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        clearInterval(interval);
        router.push('/onboarding');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  async function handleResend() {
    setResendError(null);
    setResendSuccess(false);
    if (!email) {
      setResendError('Missing email address — please register again.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) {
      setResendError(error.message);
    } else {
      setResendSuccess(true);
    }
  }

  return (
    <AuthSplitPanel>
      <div className="space-y-6">
        {/* Progress: step 3 of 8 */}
        <div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ backgroundColor: i <= 2 ? '#1a365d' : '#e5e7eb' }}
                transition={{ duration: 0.3 }}
                className="h-1 flex-1 rounded-full"
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Step 3 of 8</p>
        </div>

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1a365d] flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Mail className="w-8 h-8" />
            </motion.div>
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Check your inbox
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              We&apos;ve sent a verification link to
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
              {email || 'your email'}
            </p>
          </div>

          <p className="text-xs text-gray-400 max-w-sm">
            Click the link in that email to verify your address. This page
            will automatically update once you&apos;ve confirmed.
          </p>
        </div>

        {resendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>New verification email sent. Check your inbox.</span>
          </motion.div>
        )}

        {resendError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {resendError}
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          <ResendCooldownButton
            onResend={handleResend}
            label="Resend verification email"
            labelDuringCooldown={(s) =>
              `Resend available in ${s}s`
            }
          />
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Use a different email
          </Link>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-400 text-center">
            Didn&apos;t see the email? Check your spam folder, or make sure{' '}
            <span className="font-medium text-gray-600">{email}</span> is
            correct.
          </p>
        </div>
      </div>
    </AuthSplitPanel>
  );
}
