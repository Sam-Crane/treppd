'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Compass,
  Sparkles,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { PasswordStrength } from '@/components/auth/password-strength';

type FlowStep = 'welcome' | 'credentials';

const slideVariants = {
  enter: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? -40 : 40,
    opacity: 0,
  }),
};

export default function RegisterPage() {
  const router = useRouter();
  const [flowStep, setFlowStep] = useState<FlowStep>('welcome');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password') || '';

  function goToCredentials() {
    setDirection('forward');
    setFlowStep('credentials');
  }

  async function onSubmit(data: RegisterFormData) {
    setAuthError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    // Email verification is enabled — direct user to the "check your inbox"
    // screen instead of immediately refreshing the session.
    router.push(
      `/verify-email?email=${encodeURIComponent(data.email)}`,
    );
  }

  return (
    <AuthSplitPanel>
      {/* Flow progress: step 1 of 8 (register welcome) or step 2 of 8 (credentials) */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          {Array.from({ length: 8 }).map((_, i) => {
            const currentStep = flowStep === 'welcome' ? 0 : 1;
            const filled = i <= currentStep;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  backgroundColor: filled ? '#1a365d' : '#e5e7eb',
                }}
                transition={{ duration: 0.3 }}
                className="h-1 flex-1 rounded-full"
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Step {flowStep === 'welcome' ? 1 : 2} of 8
        </p>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {flowStep === 'welcome' && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1a365d] text-xs font-medium px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Free to start
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Let&apos;s set up your account
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                We&apos;ll build your personalised immigration roadmap in 8
                quick steps. Under 3 minutes, start to finish.
              </p>
            </div>

            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[#1a365d]/10 text-[#1a365d] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Tailored to your situation
                  </p>
                  <p className="text-xs text-gray-500">
                    Visa type, Bundesland, arrival date, goal.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[#1a365d]/10 text-[#1a365d] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Email verification
                  </p>
                  <p className="text-xs text-gray-500">
                    One-click confirmation keeps your account secure.
                  </p>
                </div>
              </div>
            </div>

            <motion.button
              onClick={goToCredentials}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1a365d] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2a4a75] transition-colors"
            >
              Continue with email
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[#1a365d] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {flowStep === 'credentials' && (
          <motion.div
            key="credentials"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Step 2 of 8 — pick an email and strong password.
              </p>
            </div>

            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    {...register('password')}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Create a password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
                <PasswordStrength password={password} />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDirection('back');
                    setFlowStep('welcome');
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.01 } : undefined}
                  whileTap={!isSubmitting ? { scale: 0.99 } : undefined}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1a365d] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2a4a75] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <p className="text-center text-xs text-gray-400">
              By creating an account you agree to our educational-use terms.
              Treppd is not legal advice. Data stored in the EU (GDPR).
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplitPanel>
  );
}
