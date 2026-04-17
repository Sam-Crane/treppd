'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { ResendCooldownButton } from '@/components/auth/resend-cooldown-button';
import { Button, FormField, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function sendReset(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) throw error;
  }

  async function onSubmit(data: ForgotPasswordFormData) {
    setAuthError(null);
    try {
      await sendReset(data.email);
      setSubmittedEmail(data.email);
    } catch (error) {
      setAuthError((error as Error).message);
    }
  }

  async function handleResend() {
    if (!submittedEmail) return;
    setAuthError(null);
    try {
      await sendReset(submittedEmail);
    } catch (error) {
      setAuthError((error as Error).message);
    }
  }

  return (
    <AuthSplitPanel>
      <AnimatePresence mode="wait">
        {!submittedEmail ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Enter the email you registered with. We&apos;ll send you a
                link to set a new password.
              </p>
            </div>

            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
                required
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    disabled={isSubmitting}
                    invalid={Boolean(errors.email)}
                    placeholder="you@example.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSubmitting}
              >
                {isSubmitting ? (
                  'Sending link…'
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-1.5 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-success dark:bg-emerald-950/50"
              >
                <CheckCircle2 className="h-8 w-8" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                  Check your inbox
                </h1>
                <p className="mt-2 max-w-sm text-sm text-text-secondary">
                  We&apos;ve sent a password reset link to
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-text-primary">
                  {submittedEmail}
                </p>
              </div>
              <p className="max-w-sm text-xs text-text-muted">
                Click the link in that email to set a new password. The link
                expires in 1 hour.
              </p>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40"
              >
                {authError}
              </motion.div>
            )}

            <div className="flex flex-col gap-3">
              <ResendCooldownButton
                onResend={handleResend}
                label="Resend reset link"
              />
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>

            <div className="border-t border-border-default pt-4">
              <p className="text-center text-xs text-text-muted">
                Didn&apos;t see the email? Check your spam folder, or make
                sure{' '}
                <span className="font-medium text-text-secondary">
                  {submittedEmail}
                </span>{' '}
                is the email on your account.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplitPanel>
  );
}
