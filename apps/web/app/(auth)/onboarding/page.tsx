'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { profileSchema } from '@/lib/schemas/onboarding';
import { api } from '@/lib/api';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { StepVisaType } from '@/components/onboarding/step-visa-type';
import { StepNationality } from '@/components/onboarding/step-nationality';
import { StepLocation } from '@/components/onboarding/step-location';
import { StepGoal } from '@/components/onboarding/step-goal';
import { StepDates } from '@/components/onboarding/step-dates';
import { Loader2 } from 'lucide-react';

const TOTAL_STEPS = 5;

const stepValidation: Record<number, (data: Record<string, unknown>) => string | null> = {
  0: (d) => (d.visa_type ? null : 'Please select a visa type'),
  1: (d) => (d.nationality ? null : 'Please select your nationality'),
  2: (d) => (d.bundesland ? null : 'Please select your state'),
  3: (d) => (d.goal ? null : 'Please select your goal'),
  4: () => null,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { step, formData, setStep, reset } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  function handleNext() {
    const validationError = stepValidation[step]?.(formData as Record<string, unknown>);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(step + 1);
  }

  function handleBack() {
    setError(null);
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

  const steps = [
    <StepVisaType key="visa" />,
    <StepNationality key="nationality" />,
    <StepLocation key="location" />,
    <StepGoal key="goal" />,
    <StepDates key="dates" />,
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Tell us about your situation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll create a personalised roadmap for your immigration
            journey.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

          <div className="mt-8">{steps[step]}</div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={!canGoBack}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                canGoBack
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'invisible'
              }`}
            >
              Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1a365d] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a4a7f] disabled:opacity-60"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? 'Creating your roadmap...' : 'Get My Roadmap'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-[#1a365d] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a4a7f]"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
