'use client';

import {
  Rocket,
  RefreshCw,
  ArrowRightLeft,
  Users,
  Building2,
} from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { goals, goalLabels } from '@/lib/schemas/onboarding';
import type { LucideIcon } from 'lucide-react';

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
        <h2 className="text-xl font-semibold text-gray-900">
          What do you need help with?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          We will tailor your roadmap based on your primary goal.
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
              className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-[#1a365d] bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? 'bg-[#1a365d] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-[#1a365d]' : 'text-gray-700'
                }`}
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
