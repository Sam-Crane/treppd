'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Globe,
  Lock,
  Sparkles,
} from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CompleteStepButton } from './complete-step-button';

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

type StepStatus = 'completed' | 'available' | 'blocked';

interface StepCardProps {
  step: RoadmapStep;
  status: StepStatus;
  isCompleted: boolean;
}

const STATUS_STYLES: Record<StepStatus, string> = {
  completed:
    'border-success/30 bg-success/5 dark:bg-success/10',
  available:
    'border-accent/30 bg-surface',
  blocked:
    'border-border-default bg-subtle opacity-60',
};

const STATUS_ICONS: Record<StepStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="h-5 w-5 text-success" />,
  available: (
    <div className="h-5 w-5 rounded-full border-2 border-accent" />
  ),
  blocked: <Lock className="h-5 w-5 text-text-muted" />,
};

export function StepCard({ step, status, isCompleted }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);

  const daysUntilDeadline = step.deadline
    ? Math.ceil(
        (new Date(step.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        STATUS_STYLES[status],
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left sm:p-5"
        disabled={status === 'blocked'}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">{STATUS_ICONS[status]}</div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-text-primary">
                {step.title}
              </h3>
              {step.ai_suggested && (
                <Badge variant="warning">
                  <Sparkles className="h-3 w-3" />
                  AI Suggested
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {step.office}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {step.estimated_days}{' '}
                {step.estimated_days === 1 ? 'day' : 'days'}
              </span>
              {step.can_do_online && (
                <span className="inline-flex items-center gap-1 text-accent">
                  <Globe className="h-3.5 w-3.5" />
                  Online
                </span>
              )}
              {step.deadline && daysUntilDeadline !== null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1',
                    daysUntilDeadline <= 7
                      ? 'font-medium text-error'
                      : 'text-warning',
                  )}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {daysUntilDeadline > 0
                    ? `${daysUntilDeadline}d left`
                    : 'Overdue'}
                </span>
              )}
              <Badge
                variant={
                  status === 'completed'
                    ? 'success'
                    : status === 'available'
                      ? 'info'
                      : 'neutral'
                }
              >
                {status === 'completed'
                  ? 'Completed'
                  : status === 'available'
                    ? 'Ready'
                    : 'Blocked'}
              </Badge>
            </div>
          </div>

          <div className="mt-1 flex-shrink-0">
            {status !== 'blocked' ? (
              expanded ? (
                <ChevronUp className="h-5 w-5 text-text-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-text-muted" />
              )
            ) : (
              <Lock className="h-5 w-5 text-text-muted/50" />
            )}
          </div>
        </div>
      </button>

      {expanded && status !== 'blocked' && (
        <div className="border-t border-border-default px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          <div className="space-y-4 pt-4">
            <p className="text-sm leading-relaxed text-text-secondary">
              {step.explanation}
            </p>

            {step.tips.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-text-primary">
                  Tips
                </h4>
                <ul className="space-y-1.5">
                  {step.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="mt-px font-medium text-accent">
                        {i + 1}.
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.documents_needed.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-text-primary">
                  Documents Required ({step.documents_needed.length})
                </h4>
                <ul className="space-y-1.5">
                  {step.documents_needed.map((doc, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                      <span>
                        {doc.document_name_en}
                        {(doc.needs_translation ||
                          doc.needs_apostille ||
                          doc.needs_certified_copy) && (
                          <span className="ml-1.5 text-xs text-text-muted">
                            {[
                              doc.needs_certified_copy && 'Certified',
                              doc.needs_translation && 'Translation',
                              doc.needs_apostille && 'Apostille',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.ai_suggested && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">AI Suggested</span>
                </div>
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  This step was suggested by AI. Please verify requirements
                  with your local Ausländerbehörde.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <CompleteStepButton
                slug={step.slug}
                isCompleted={isCompleted}
              />
              <Button asChild variant="link" size="sm">
                <Link href={`/roadmap/${step.slug}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
