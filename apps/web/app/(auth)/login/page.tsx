'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, Mail, Lock } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { Button, FormField, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    router.refresh();
    router.push('/dashboard');
  }

  return (
    <AuthSplitPanel>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to continue your roadmap.
          </p>
        </div>

        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
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
                disabled={isSubmitting}
                invalid={Boolean(errors.email)}
                placeholder="you@example.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            required
            labelSecondary={
              <Link
                href="/forgot-password"
                className="text-[10px] font-medium text-accent hover:underline"
              >
                Forgot password?
              </Link>
            }
          >
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={isSubmitting}
                invalid={Boolean(errors.password)}
                placeholder="Your password"
                className="pl-10"
                {...register('password')}
              />
            </div>
          </FormField>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-text-muted">
          By signing in you agree to our educational-use terms. Treppd is not
          legal advice.
        </p>
      </div>
    </AuthSplitPanel>
  );
}
