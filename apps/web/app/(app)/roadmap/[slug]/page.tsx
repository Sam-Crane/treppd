'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Clock,
  Copy,
  FileText,
  Globe,
  Languages,
  ShieldCheck,
  Sparkles,
  Stamp,
} from 'lucide-react';

import { api } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { cn } from '@/lib/utils';
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
  completedSteps: string[],
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
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Card padding="lg">
        <Skeleton className="h-7 w-3/4" />
        <div className="mt-3 flex gap-3">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Card>
    </div>
  );
}

export default function StepDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => api.get<RoadmapResponse>('/roadmap'),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ completed_steps: string[] }>('/profiles/me'),
  });

  const completedSteps = profile?.completed_steps ?? [];
  const step = roadmap?.steps.find((s) => s.slug === slug);

  if (isLoading) return <LoadingSkeleton />;

  if (!step) {
    return (
      <div className="space-y-6">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>
        <EmptyState
          icon={FileText}
          title="Step not found"
          description="This step could not be found in your roadmap. It may have been removed or your roadmap needs to be regenerated."
          action={
            <Button asChild variant="secondary">
              <Link href="/roadmap">Back to Roadmap</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const status = getStepStatus(step, completedSteps);
  const isCompleted = completedSteps.includes(step.slug);
  const daysUntilDeadline = step.deadline
    ? Math.ceil(
        (new Date(step.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/roadmap"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Roadmap
      </Link>

      {/* Header */}
      <Card padding="lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
            {step.title}
          </h1>
          <Badge
            variant={
              status === 'completed'
                ? 'success'
                : status === 'available'
                  ? 'info'
                  : 'neutral'
            }
            size="lg"
          >
            {status === 'completed'
              ? 'Completed'
              : status === 'available'
                ? 'Ready'
                : 'Blocked'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Building2 className="h-4 w-4 text-text-muted" />
            {step.office}
          </span>
          {step.can_do_online && (
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Globe className="h-4 w-4" />
              Available Online
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Clock className="h-4 w-4 text-text-muted" />
            Estimated {step.estimated_days}{' '}
            {step.estimated_days === 1 ? 'day' : 'days'}
          </span>
          {step.source_verified && (
            <span className="inline-flex items-center gap-1.5 text-success">
              <ShieldCheck className="h-4 w-4" />
              Verified
            </span>
          )}
        </div>

        {step.deadline && daysUntilDeadline !== null && (
          <div
            className={cn(
              'mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm',
              daysUntilDeadline <= 7
                ? 'border-red-200 bg-red-50 text-error dark:border-red-800 dark:bg-red-950/40'
                : daysUntilDeadline <= 30
                  ? 'border-amber-200 bg-amber-50 text-warning dark:border-amber-800 dark:bg-amber-950/40'
                  : 'border-blue-200 bg-blue-50 text-accent dark:border-blue-800 dark:bg-blue-950/40',
            )}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
      </Card>

      {/* Explanation */}
      <Card padding="lg">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          What You Need to Do
        </h2>
        <p className="leading-relaxed text-text-secondary">
          {step.explanation}
        </p>
      </Card>

      {/* Tips */}
      {step.tips.length > 0 && (
        <Card padding="lg">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Helpful Tips
          </h2>
          <ol className="space-y-3">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent-hover dark:text-accent">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-text-secondary">
                  {tip}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Documents */}
      {step.documents_needed.length > 0 && (
        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Required Documents ({step.documents_needed.length})
          </h2>
          <div className="space-y-4">
            {step.documents_needed.map((doc, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-default p-4 transition-colors hover:bg-subtle"
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-muted" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-text-primary">
                      {doc.document_name_en}
                    </h3>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {doc.document_name_de}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {doc.needs_certified_copy && (
                        <Badge variant="warning">
                          <Copy className="h-3 w-3" />
                          Certified Copy
                        </Badge>
                      )}
                      {doc.needs_translation && (
                        <Badge variant="info">
                          <Languages className="h-3 w-3" />
                          Translation
                        </Badge>
                      )}
                      {doc.needs_apostille && (
                        <Badge variant="error">
                          <Stamp className="h-3 w-3" />
                          Apostille
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      {doc.where_to_get && (
                        <span>
                          <span className="font-medium text-text-primary">
                            Where:
                          </span>{' '}
                          {doc.where_to_get}
                        </span>
                      )}
                      {doc.estimated_cost_eur !== null && (
                        <span>
                          <span className="font-medium text-text-primary">
                            Cost:
                          </span>{' '}
                          ~€{doc.estimated_cost_eur}
                        </span>
                      )}
                    </div>

                    {doc.specifications &&
                      Object.keys(doc.specifications).length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium text-text-muted hover:text-text-secondary">
                            Specifications
                          </summary>
                          <div className="mt-2 space-y-1 rounded bg-subtle p-3 text-xs text-text-secondary">
                            {Object.entries(doc.specifications).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">
                                    {key.replace(/_/g, ' ')}:
                                  </span>{' '}
                                  {String(value)}
                                </div>
                              ),
                            )}
                          </div>
                        </details>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Notice */}
      {step.ai_suggested && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
              AI-Suggested Step
            </h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            This step was generated by AI based on your profile. Requirements
            may vary by location. Please verify all details with your local
            Ausländerbehörde before proceeding.
          </p>
        </div>
      )}

      {/* Actions */}
      <Card
        padding="md"
        className="flex items-center justify-between"
      >
        <CompleteStepButton slug={step.slug} isCompleted={isCompleted} />
        <Button asChild variant="ghost" size="sm">
          <Link href="/roadmap">
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmap
          </Link>
        </Button>
      </Card>
    </div>
  );
}
