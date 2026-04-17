'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { ResendCooldownButton } from '@/components/auth/resend-cooldown-button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

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
                animate={{ opacity: i <= 2 ? 1 : 0.25 }}
                transition={{ duration: 0.3 }}
                className="h-1 flex-1 rounded-full bg-accent"
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">Step 3 of 8</p>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle text-accent-hover dark:text-accent"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Mail className="h-8 w-8" />
            </motion.div>
          </motion.div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Check your inbox
            </h1>
            <p className="mt-2 max-w-sm text-sm text-text-secondary">
              We&apos;ve sent a verification link to
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-text-primary">
              {email || 'your email'}
            </p>
          </div>

          <p className="max-w-sm text-xs text-text-muted">
            Click the link in that email to verify your address. This page
            will automatically update once you&apos;ve confirmed.
          </p>
        </div>

        {resendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-success dark:border-emerald-900 dark:bg-emerald-950/40"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>New verification email sent. Check your inbox.</span>
          </motion.div>
        )}

        {resendError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40"
          >
            {resendError}
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          <ResendCooldownButton
            onResend={handleResend}
            label="Resend verification email"
            labelDuringCooldown={(s) => `Resend available in ${s}s`}
          />
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-1.5 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Use a different email
          </Link>
        </div>

        <div className="border-t border-border-default pt-4">
          <p className="text-center text-xs text-text-muted">
            Didn&apos;t see the email? Check your spam folder, or make sure{' '}
            <span className="font-medium text-text-secondary">{email}</span> is
            correct.
          </p>
        </div>
      </div>
    </AuthSplitPanel>
  );
}
