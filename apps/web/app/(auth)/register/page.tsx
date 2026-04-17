'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Compass,
  Lock,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { PasswordStrength } from '@/components/auth/password-strength';
import { Button, FormField, Input } from '@/components/ui';

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

function FlowProgress({ step }: { step: FlowStep }) {
  const currentStep = step === 'welcome' ? 0 : 1;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1">
        {Array.from({ length: 8 }).map((_, i) => {
          const filled = i <= currentStep;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: filled ? 1 : 0.25 }}
              transition={{ duration: 0.3 }}
              className="h-1 flex-1 rounded-full bg-accent"
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Step {currentStep + 1} of 8
      </p>
    </div>
  );
}

function ValueProp({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Compass;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-subtle/50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
    </div>
  );
}

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

    const fullName = `${data.first_name.trim()} ${data.last_name.trim()}`;
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: {
          full_name: fullName,
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  }

  return (
    <AuthSplitPanel>
      <FlowProgress step={flowStep} />

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
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent-hover dark:text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Free to start
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                Let&apos;s set up your account
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                We&apos;ll build your personalised immigration roadmap in 8
                quick steps. Under 3 minutes, start to finish.
              </p>
            </div>

            <div className="space-y-3 py-2">
              <ValueProp
                icon={Compass}
                title="Tailored to your situation"
                description="Visa type, Bundesland, arrival date, goal."
              />
              <ValueProp
                icon={Mail}
                title="Email verification"
                description="One-click confirmation keeps your account secure."
              />
            </div>

            <Button
              onClick={goToCredentials}
              size="lg"
              className="w-full"
            >
              Continue with email
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-accent hover:underline"
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
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
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
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="First name"
                  htmlFor="first_name"
                  error={errors.first_name?.message}
                  required
                >
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="first_name"
                      type="text"
                      autoComplete="given-name"
                      autoFocus
                      disabled={isSubmitting}
                      invalid={Boolean(errors.first_name)}
                      placeholder="Anna"
                      className="pl-10"
                      {...register('first_name')}
                    />
                  </div>
                </FormField>
                <FormField
                  label="Last name"
                  htmlFor="last_name"
                  error={errors.last_name?.message}
                  required
                >
                  <Input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    disabled={isSubmitting}
                    invalid={Boolean(errors.last_name)}
                    placeholder="Müller"
                    {...register('last_name')}
                  />
                </FormField>
              </div>

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
              >
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    invalid={Boolean(errors.password)}
                    placeholder="Create a password"
                    className="pl-10"
                    {...register('password')}
                  />
                </div>
                <PasswordStrength password={password} />
              </FormField>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDirection('back');
                    setFlowStep('welcome');
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={isSubmitting}
                >
                  {isSubmitting ? (
                    'Creating account…'
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <p className="text-center text-xs text-text-muted">
              By creating an account you agree to our educational-use terms.
              Treppd is not legal advice. Data stored in the EU (GDPR).
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplitPanel>
  );
}
