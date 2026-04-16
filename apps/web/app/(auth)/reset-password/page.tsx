'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Loader2,
  Shield,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { PasswordStrength } from '@/components/auth/password-strength';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password') || '';

  // Verify the recovery session Supabase set when the user clicked the email
  // link. If no session, the link was invalid or expired.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function onSubmit(data: ResetPasswordFormData) {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    router.refresh();
    router.push('/dashboard');
  }

  if (hasSession === null) {
    return (
      <AuthSplitPanel>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AuthSplitPanel>
    );
  }

  if (!hasSession) {
    return (
      <AuthSplitPanel>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reset link invalid or expired
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              Password reset links expire after 1 hour and can only be used
              once. Please request a new one.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 bg-[#1a365d] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2a4a75] transition-colors"
          >
            Request a new link
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthSplitPanel>
    );
  }

  return (
    <AuthSplitPanel>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1a365d]/10 text-[#1a365d] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Set a new password
            </h1>
            <p className="text-sm text-gray-500">
              Choose a strong one you&apos;ll remember.
            </p>
          </div>
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
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                disabled={isSubmitting}
                {...register('password')}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50"
                placeholder="Create a new password"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
            <PasswordStrength password={password} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('confirmPassword')}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50"
                placeholder="Re-enter your new password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.confirmPassword.message}
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
                Updating password...
              </>
            ) : (
              <>
                Update password
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </AuthSplitPanel>
  );
}
