'use client';

import {
  GraduationCap,
  Briefcase,
  Search,
  Users,
  Laptop,
  Heart,
} from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { visaTypes, visaTypeLabels } from '@/lib/schemas/onboarding';
import type { LucideIcon } from 'lucide-react';

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
        <h2 className="text-xl font-semibold text-gray-900">
          What type of visa do you have?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
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
              className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
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
                {visaTypeLabels[type]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
