'use client';

import { Building2, Calendar, GraduationCap } from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { FormField, Input } from '@/components/ui';

export function StepDates() {
  const { formData, updateFormData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          Important dates
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          These help us calculate deadlines and remind you of upcoming tasks.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          label="Arrival date in Germany"
          htmlFor="arrival_date"
        >
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="arrival_date"
              type="date"
              value={formData.arrival_date || ''}
              onChange={(e) => updateFormData({ arrival_date: e.target.value })}
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField
          label="Visa / permit expiry date"
          htmlFor="visa_expiry_date"
        >
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="visa_expiry_date"
              type="date"
              value={formData.visa_expiry_date || ''}
              onChange={(e) =>
                updateFormData({ visa_expiry_date: e.target.value })
              }
              className="pl-10"
            />
          </div>
        </FormField>

        {formData.visa_type === 'student' && (
          <FormField label="University name" htmlFor="university_name">
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="university_name"
                type="text"
                placeholder="e.g. TU Munich, Humboldt University"
                value={formData.university_name || ''}
                onChange={(e) =>
                  updateFormData({ university_name: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </FormField>
        )}

        {formData.visa_type === 'work' && (
          <FormField label="Employer name" htmlFor="employer_name">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="employer_name"
                type="text"
                placeholder="e.g. SAP, Siemens, BMW"
                value={formData.employer_name || ''}
                onChange={(e) =>
                  updateFormData({ employer_name: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </FormField>
        )}
      </div>
    </div>
  );
}
