'use client';

import {
  ArrowRightLeft,
  Building2,
  RefreshCw,
  Rocket,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { goals, goalLabels } from '@/lib/schemas/onboarding';
import { cn } from '@/lib/utils';

const goalIcons: Record<string, LucideIcon> = {
  initial_setup: Rocket,
  visa_renewal: RefreshCw,
  change_visa: ArrowRightLeft,
  family_reunion: Users,
  job_change: Building2,
};

export function StepGoal() {
  const { formData, updateFormData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          What do you need help with?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          We&apos;ll tailor your roadmap based on your primary goal.
        </p>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const Icon = goalIcons[goal];
          const isSelected = formData.goal === goal;

          return (
            <button
              key={goal}
              type="button"
              onClick={() => updateFormData({ goal })}
              aria-pressed={isSelected}
              className={cn(
                'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isSelected
                  ? 'border-accent bg-accent-subtle shadow-xs'
                  : 'border-border-default bg-surface hover:border-border-strong hover:shadow-xs',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-subtle text-text-secondary',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected
                    ? 'text-accent-hover dark:text-accent'
                    : 'text-text-primary',
                )}
              >
                {goalLabels[goal]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
