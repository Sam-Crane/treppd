'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { ResendCooldownButton } from '@/components/auth/resend-cooldown-button';

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
              <h1 className="text-3xl font-bold text-gray-900">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-gray-500">
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
                  className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    disabled={isSubmitting}
                    {...register('email')}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.01 } : undefined}
                whileTap={!isSubmitting ? { scale: 0.99 } : undefined}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1a365d] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2a4a75] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
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
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm text-gray-500 max-w-sm">
                  We&apos;ve sent a password reset link to
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
                  {submittedEmail}
                </p>
              </div>
              <p className="text-xs text-gray-400 max-w-sm">
                Click the link in that email to set a new password. The link
                expires in 1 hour.
              </p>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
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
                className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-400 text-center">
                Didn&apos;t see the email? Check your spam folder, or make
                sure <span className="font-medium text-gray-600">{submittedEmail}</span> is the email on your account.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplitPanel>
  );
}
