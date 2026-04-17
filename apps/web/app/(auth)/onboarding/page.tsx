'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { profileSchema, stepSchemas } from '@/lib/schemas/onboarding';
import { api } from '@/lib/api';
import { StepVisaType } from '@/components/onboarding/step-visa-type';
import { StepNationality } from '@/components/onboarding/step-nationality';
import { StepLocation } from '@/components/onboarding/step-location';
import { StepGoal } from '@/components/onboarding/step-goal';
import { StepDates } from '@/components/onboarding/step-dates';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';
import { Button } from '@/components/ui';

const TOTAL_STEPS = 5;
// Onboarding represents steps 4-8 of the 8-step sign-up flow
const GLOBAL_STEP_OFFSET = 3;
const GLOBAL_TOTAL_STEPS = 8;

const stepTitles = [
  'What type of visa do you have?',
  'Where are you from?',
  'Where in Germany?',
  'What brings you here?',
  'A few key dates',
];

/**
 * Validate the current step using the per-step Zod schema.
 * Returns null on success, or the first error message string on failure.
 */
function validateStep(
  step: number,
  data: Record<string, unknown>,
): string | null {
  const schema = stepSchemas[step];
  if (!schema) return null;
  const result = schema.safeParse(data);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Please check your selection';
}

const slideVariants = {
  enter: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? 30 : -30,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? -30 : 30,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const { step, formData, setStep, reset } = useOnboardingStore();
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;
  const globalStep = step + GLOBAL_STEP_OFFSET;

  function handleNext() {
    const validationError = validateStep(
      step,
      formData as Record<string, unknown>,
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setDirection('forward');
    setStep(step + 1);
  }

  function handleBack() {
    setError(null);
    setDirection('back');
    setStep(step - 1);
  }

  async function handleSubmit() {
    const parsed = profileSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      setError(firstError?.message || 'Please check your inputs');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/profiles', parsed.data);
      reset();
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      );
      setIsSubmitting(false);
    }
  }

  const stepComponents = [
    <StepVisaType key="visa" />,
    <StepNationality key="nationality" />,
    <StepLocation key="location" />,
    <StepGoal key="goal" />,
    <StepDates key="dates" />,
  ];

  return (
    <AuthSplitPanel>
      <div className="space-y-6">
        {/* Global progress bar — steps 4..8 of 8 */}
        <div>
          <div className="flex items-center gap-1">
            {Array.from({ length: GLOBAL_TOTAL_STEPS }).map((_, i) => {
              const filled = i <= globalStep;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ opacity: filled ? 1 : 0.2 }}
                  transition={{ duration: 0.3 }}
                  className="h-1 flex-1 rounded-full bg-accent"
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Step {globalStep + 1} of {GLOBAL_TOTAL_STEPS}
          </p>
        </div>

        {/* Step title */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              {stepTitles[step]}
            </h1>
            <p className="text-sm text-text-secondary">
              Almost there — {TOTAL_STEPS - step - 1} step
              {TOTAL_STEPS - step - 1 === 1 ? '' : 's'} to go.
            </p>
          </div>
        </div>

        {/* Step body with animated transitions */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {stepComponents[step]}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBack}
            className={canGoBack ? '' : 'invisible'}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              {isSubmitting ? (
                'Creating your roadmap…'
              ) : (
                <>
                  Get my roadmap
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AuthSplitPanel>
  );
}
