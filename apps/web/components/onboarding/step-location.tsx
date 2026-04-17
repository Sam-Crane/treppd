'use client';

import { Info, MapPin } from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { bundeslaender } from '@/lib/schemas/onboarding';
import { FormField, Input, Select } from '@/components/ui';

const mvpStates = ['DE-BY', 'DE-BE', 'DE-NW'];

export function StepLocation() {
  const { formData, updateFormData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          Where in Germany are you located?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          We use this to find the right offices and requirements for your area.
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="State (Bundesland)" htmlFor="bundesland" required>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Select
              id="bundesland"
              value={formData.bundesland || ''}
              onChange={(e) => updateFormData({ bundesland: e.target.value })}
              className="pl-10"
            >
              <option value="">Select your state…</option>
              {bundeslaender.map((land) => (
                <option key={land.code} value={land.code}>
                  {land.name}
                  {mvpStates.includes(land.code) ? '' : ' (coming soon)'}
                </option>
              ))}
            </Select>
          </div>
        </FormField>

        <FormField
          label="City"
          labelSecondary="optional"
          htmlFor="city"
        >
          <Input
            id="city"
            type="text"
            placeholder="e.g. Munich, Berlin, Cologne"
            value={formData.city || ''}
            onChange={(e) => updateFormData({ city: e.target.value })}
          />
        </FormField>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-accent-subtle p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-hover dark:text-accent" />
        <p className="text-xs text-accent-hover dark:text-accent">
          <strong>MVP coverage:</strong> Bavaria, Berlin, and NRW have full
          office and procedure data. Other states are coming soon.
        </p>
      </div>
    </div>
  );
}
