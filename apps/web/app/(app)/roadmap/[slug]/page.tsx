'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Clock,
  AlertCircle,
  Globe,
  Sparkles,
  ShieldCheck,
  FileText,
  Languages,
  Stamp,
  Copy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CompleteStepButton } from '@/components/roadmap/complete-step-button';

interface DocumentRequirement {
  document_name_en: string;
  document_name_de: string;
  specifications: Record<string, unknown>;
  needs_certified_copy: boolean;
  needs_translation: boolean;
  needs_apostille: boolean;
  where_to_get: string;
  estimated_cost_eur: number | null;
}

interface RoadmapStep {
  slug: string;
  title: string;
  explanation: string;
  office: string;
  can_do_online: boolean;
  estimated_days: number;
  depends_on: string[];
  documents_needed: DocumentRequirement[];
  tips: string[];
  deadline: string | null;
  ai_suggested: boolean;
  source_verified: boolean;
}

interface RoadmapResponse {
  steps: RoadmapStep[];
  ai_enriched: boolean;
  ai_fallback: boolean;
}

function getStepStatus(
  step: RoadmapStep,
  completedSteps: string[]
): 'completed' | 'available' | 'blocked' {
  if (completedSteps.includes(step.slug)) return 'completed';
  if (
    step.depends_on.length === 0 ||
    step.depends_on.every((dep) => completedSteps.includes(dep))
  ) {
    return 'available';
  }
  return 'blocked';
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-3">
          <div className="h-8 bg-gray-100 rounded-lg w-32" />
          <div className="h-8 bg-gray-100 rounded-lg w-24" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

export default function StepDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: roadmap, isLoading: roadmapLoading } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => api.get<RoadmapResponse>('/roadmap'),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ completed_steps: string[] }>('/profiles/me'),
  });

  const completedSteps = profile?.completed_steps ?? [];
  const step = roadmap?.steps.find((s) => s.slug === slug);

  if (roadmapLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!step) {
    return (
      <div className="space-y-6">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Roadmap
        </Link>
        <div className="bg-white rounded-xl border p-8 sm:p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Step Not Found
          </h2>
          <p className="text-gray-500">
            This step could not be found in your roadmap. It may have been
            removed or your roadmap needs to be regenerated.
          </p>
        </div>
      </div>
    );
  }

  const status = getStepStatus(step, completedSteps);
  const isCompleted = completedSteps.includes(step.slug);
  const daysUntilDeadline = step.deadline
    ? Math.ceil(
        (new Date(step.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const statusConfig = {
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-700',
    },
    available: { label: 'Ready', className: 'bg-blue-100 text-blue-700' },
    blocked: { label: 'Blocked', className: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/roadmap"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Roadmap
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {step.title}
            </h1>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${statusConfig[status].className}`}
          >
            {statusConfig[status].label}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-sm">
          <span className="inline-flex items-center gap-1.5 text-gray-600">
            <Building2 className="w-4 h-4 text-gray-400" />
            {step.office}
          </span>
          {step.can_do_online && (
            <span className="inline-flex items-center gap-1.5 text-blue-600">
              <Globe className="w-4 h-4" />
              Available Online
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            Estimated {step.estimated_days}{' '}
            {step.estimated_days === 1 ? 'day' : 'days'}
          </span>
          {step.source_verified && (
            <span className="inline-flex items-center gap-1.5 text-green-600">
              <ShieldCheck className="w-4 h-4" />
              Verified
            </span>
          )}
        </div>

        {step.deadline && daysUntilDeadline !== null && (
          <div
            className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${
              daysUntilDeadline <= 7
                ? 'bg-red-50 text-red-700 border border-red-200'
                : daysUntilDeadline <= 30
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <span className="font-medium">Deadline:</span>{' '}
              {new Date(step.deadline).toLocaleDateString('en-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {daysUntilDeadline > 0
                ? ` (${daysUntilDeadline} days remaining)`
                : ' (Overdue)'}
            </span>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          What You Need to Do
        </h2>
        <p className="text-gray-700 leading-relaxed">{step.explanation}</p>
      </div>

      {/* Tips */}
      {step.tips.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Helpful Tips
          </h2>
          <ol className="space-y-3">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-[#1a365d] text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-sm leading-relaxed">
                  {tip}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Documents */}
      {step.documents_needed.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Required Documents ({step.documents_needed.length})
          </h2>
          <div className="space-y-4">
            {step.documents_needed.map((doc, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {doc.document_name_en}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {doc.document_name_de}
                    </p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {doc.needs_certified_copy && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                          <Copy className="w-3 h-3" />
                          Certified Copy
                        </span>
                      )}
                      {doc.needs_translation && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          <Languages className="w-3 h-3" />
                          Translation Required
                        </span>
                      )}
                      {doc.needs_apostille && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          <Stamp className="w-3 h-3" />
                          Apostille Required
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {doc.where_to_get && (
                        <span>
                          <span className="font-medium text-gray-600">
                            Where:
                          </span>{' '}
                          {doc.where_to_get}
                        </span>
                      )}
                      {doc.estimated_cost_eur !== null && (
                        <span>
                          <span className="font-medium text-gray-600">
                            Cost:
                          </span>{' '}
                          ~EUR {doc.estimated_cost_eur}
                        </span>
                      )}
                    </div>

                    {Object.keys(doc.specifications).length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                          Specifications
                        </summary>
                        <div className="mt-2 bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-1">
                          {Object.entries(doc.specifications).map(
                            ([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">
                                  {key.replace(/_/g, ' ')}:
                                </span>{' '}
                                {String(value)}
                              </div>
                            )
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Notice */}
      {step.ai_suggested && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">
              AI-Suggested Step
            </h3>
          </div>
          <p className="text-sm text-yellow-700">
            This step was generated by AI based on your profile. Requirements
            may vary by location and individual circumstances. Please verify all
            details with your local Auslaenderbehoerde (foreigners office)
            before proceeding.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6 flex items-center justify-between">
        <CompleteStepButton
          slug={step.slug}
          isCompleted={isCompleted}
          disabled={status === 'blocked'}
        />
        <Link
          href="/roadmap"
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Back to Roadmap
        </Link>
      </div>
    </div>
  );
}
