'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Shield,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { PasswordStrength } from '@/components/auth/password-strength';
import { Button, FormField, Input } from '@/components/ui';

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
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      </AuthSplitPanel>
    );
  }

  if (!hasSession) {
    return (
      <AuthSplitPanel>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-warning dark:bg-amber-950/50">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Reset link invalid or expired
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
              Password reset links expire after 1 hour and can only be used
              once. Please request a new one.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/forgot-password">
              Request a new link
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AuthSplitPanel>
    );
  }

  return (
    <AuthSplitPanel>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Set a new password
            </h1>
            <p className="text-sm text-text-secondary">
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
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="New password"
            htmlFor="password"
            error={errors.password?.message}
            required
          >
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                disabled={isSubmitting}
                invalid={Boolean(errors.password)}
                placeholder="Create a new password"
                className="pl-10"
                {...register('password')}
              />
            </div>
            <PasswordStrength password={password} />
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
            required
          >
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                invalid={Boolean(errors.confirmPassword)}
                placeholder="Re-enter your new password"
                className="pl-10"
                {...register('confirmPassword')}
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
              'Updating password…'
            ) : (
              <>
                Update password
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </AuthSplitPanel>
  );
}
