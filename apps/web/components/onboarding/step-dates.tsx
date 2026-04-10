'use client';

import { Calendar, GraduationCap, Building2 } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function StepDates() {
  const { formData, updateFormData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Important dates
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          These help us calculate deadlines and remind you of upcoming tasks.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="arrival_date"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Arrival date in Germany
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="arrival_date"
              type="date"
              value={formData.arrival_date || ''}
              onChange={(e) =>
                updateFormData({ arrival_date: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="visa_expiry_date"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Visa / permit expiry date
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="visa_expiry_date"
              type="date"
              value={formData.visa_expiry_date || ''}
              onChange={(e) =>
                updateFormData({ visa_expiry_date: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            />
          </div>
        </div>

        {formData.visa_type === 'student' && (
          <div>
            <label
              htmlFor="university_name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              University name
            </label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="university_name"
                type="text"
                placeholder="e.g. TU Munich, Humboldt University"
                value={formData.university_name || ''}
                onChange={(e) =>
                  updateFormData({ university_name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
              />
            </div>
          </div>
        )}

        {formData.visa_type === 'work' && (
          <div>
            <label
              htmlFor="employer_name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Employer name
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="employer_name"
                type="text"
                placeholder="e.g. SAP, Siemens, BMW"
                value={formData.employer_name || ''}
                onChange={(e) =>
                  updateFormData({ employer_name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
