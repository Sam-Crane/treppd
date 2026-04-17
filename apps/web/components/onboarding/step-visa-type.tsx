'use client';

import {
  Briefcase,
  GraduationCap,
  Heart,
  Laptop,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { visaTypes, visaTypeLabels } from '@/lib/schemas/onboarding';
import { cn } from '@/lib/utils';

const visaIcons: Record<string, LucideIcon> = {
  student: GraduationCap,
  work: Briefcase,
  job_seeker: Search,
  family: Users,
  freelance: Laptop,
  au_pair: Heart,
};

export function StepVisaType() {
  const { formData, updateFormData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          What type of visa do you have?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Select the visa type that best matches your situation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visaTypes.map((type) => {
          const Icon = visaIcons[type];
          const isSelected = formData.visa_type === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => updateFormData({ visa_type: type })}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center gap-4 rounded-xl border p-4 text-left transition-all',
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
                {visaTypeLabels[type]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
