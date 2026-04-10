'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Globe } from 'lucide-react';

interface Step {
  slug: string;
  title: string;
  office: string;
  estimated_days: number;
}

interface UpcomingStepsProps {
  steps: Step[];
}

export function UpcomingSteps({ steps }: UpcomingStepsProps) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          No upcoming steps. You are all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div
          key={step.slug}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1a365d]">
            {step.office === 'online' ? (
              <Globe className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {step.title}
            </p>
            <p className="text-xs text-gray-500">
              {step.office} &middot; ~{step.estimated_days} days
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
        </div>
      ))}

      <Link
        href="/roadmap"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a365d] hover:underline"
      >
        View full roadmap
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
