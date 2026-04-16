'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { profileSchema } from '@/lib/schemas/onboarding';
import { api } from '@/lib/api';
import { StepVisaType } from '@/components/onboarding/step-visa-type';
import { StepNationality } from '@/components/onboarding/step-nationality';
import { StepLocation } from '@/components/onboarding/step-location';
import { StepGoal } from '@/components/onboarding/step-goal';
import { StepDates } from '@/components/onboarding/step-dates';
import { AuthSplitPanel } from '@/components/auth/auth-split-panel';

const TOTAL_STEPS = 5;
// Onboarding represents steps 4-8 of the guided 8-step sign-up flow
// (step 1 = register welcome, step 2 = credentials, step 3 = verify email)
const GLOBAL_STEP_OFFSET = 3;
const GLOBAL_TOTAL_STEPS = 8;

const stepTitles = [
  'What type of visa do you have?',
  'Where are you from?',
  'Where in Germany?',
  'What brings you here?',
  'A few key dates',
];

const stepValidation: Record<
  number,
  (data: Record<string, unknown>) => string | null
> = {
  0: (d) => (d.visa_type ? null : 'Please select a visa type'),
  1: (d) => (d.nationality ? null : 'Please select your nationality'),
  2: (d) => (d.bundesland ? null : 'Please select your state'),
  3: (d) => (d.goal ? null : 'Please select your goal'),
  4: () => null,
};

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
  const globalStep = step + GLOBAL_STEP_OFFSET; // 0-indexed into 8 dots

  function handleNext() {
    const validationError = stepValidation[step]?.(
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
                  animate={{ backgroundColor: filled ? '#1a365d' : '#e5e7eb' }}
                  transition={{ duration: 0.3 }}
                  className="h-1 flex-1 rounded-full"
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Step {globalStep + 1} of {GLOBAL_TOTAL_STEPS}
          </p>
        </div>

        {/* Step title */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-[#1a365d]/10 text-[#1a365d] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {stepTitles[step]}
            </h1>
            <p className="text-sm text-gray-500">
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
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={!canGoBack}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              canGoBack
                ? 'text-gray-700 hover:bg-gray-100'
                : 'invisible'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {isLastStep ? (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.01 } : undefined}
              whileTap={!isSubmitting ? { scale: 0.99 } : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a4a75] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your roadmap...
                </>
              ) : (
                <>
                  Get my roadmap
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a4a75]"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </AuthSplitPanel>
  );
}
