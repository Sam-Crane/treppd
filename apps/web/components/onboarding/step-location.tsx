'use client';

import { MapPin, Info } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { bundeslaender } from '@/lib/schemas/onboarding';

const mvpStates = ['DE-BY', 'DE-BE', 'DE-NW'];

export function StepLocation() {
  const { formData, updateFormData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Where in Germany are you located?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          We use this to find the right offices and requirements for your area.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="bundesland"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            State (Bundesland)
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              id="bundesland"
              value={formData.bundesland || ''}
              onChange={(e) => updateFormData({ bundesland: e.target.value })}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            >
              <option value="">Select your state...</option>
              {bundeslaender.map((land) => (
                <option key={land.code} value={land.code}>
                  {land.name}
                  {mvpStates.includes(land.code) ? '' : ' (coming soon)'}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="city"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            City{' '}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="city"
            type="text"
            placeholder="e.g. Munich, Berlin, Cologne"
            value={formData.city || ''}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1a365d]" />
        <p className="text-xs text-[#1a365d]">
          <strong>MVP coverage:</strong> Bavaria, Berlin, and NRW have full
          office and procedure data. Other states are coming soon with community
          contributions.
        </p>
      </div>
    </div>
  );
}
