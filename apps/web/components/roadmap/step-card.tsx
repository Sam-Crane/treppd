'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  FileText,
} from 'lucide-react';
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

export function StepCard({ step, status, isCompleted }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusStyles: Record<StepStatus, string> = {
    completed: 'border-green-300 bg-green-50',
    available: 'border-blue-300 bg-white',
    blocked: 'border-gray-200 bg-gray-50 opacity-75',
  };

  const statusIcons: Record<StepStatus, React.ReactNode> = {
    completed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    available: <div className="w-5 h-5 rounded-full border-2 border-blue-400" />,
    blocked: <Lock className="w-5 h-5 text-gray-400" />,
  };

  const statusLabels: Record<StepStatus, string> = {
    completed: 'Completed',
    available: 'Ready',
    blocked: 'Blocked',
  };

  const daysUntilDeadline = step.deadline
    ? Math.ceil((new Date(step.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className={`rounded-xl border-2 transition-all ${statusStyles[status]}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 sm:p-5"
        disabled={status === 'blocked'}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">{statusIcons[status]}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-base">
                {step.title}
              </h3>
              {step.ai_suggested && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI Suggested
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {step.office}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {step.estimated_days} {step.estimated_days === 1 ? 'day' : 'days'}
              </span>
              {step.can_do_online && (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Globe className="w-3.5 h-3.5" />
                  Online
                </span>
              )}
              {step.deadline && daysUntilDeadline !== null && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    daysUntilDeadline <= 7
                      ? 'text-red-600 font-medium'
                      : 'text-orange-600'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {daysUntilDeadline > 0
                    ? `${daysUntilDeadline}d left`
                    : 'Overdue'}
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : status === 'available'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {statusLabels[status]}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 mt-1">
            {status !== 'blocked' ? (
              expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )
            ) : (
              <Lock className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>
      </button>

      {expanded && status !== 'blocked' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-100">
          <div className="pt-4 space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {step.explanation}
            </p>

            {step.tips.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Tips</h4>
                <ul className="space-y-1.5">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 font-medium mt-px">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.documents_needed.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Documents Required ({step.documents_needed.length})
                </h4>
                <ul className="space-y-1.5">
                  {step.documents_needed.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <FileText className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span>
                        {doc.document_name_en}
                        {(doc.needs_translation || doc.needs_apostille || doc.needs_certified_copy) && (
                          <span className="ml-1.5 text-xs text-gray-400">
                            {[
                              doc.needs_certified_copy && 'Certified',
                              doc.needs_translation && 'Translation',
                              doc.needs_apostille && 'Apostille',
                            ]
                              .filter(Boolean)
                              .join(' | ')}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.ai_suggested && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">AI Suggested</span>
                </div>
                <p className="mt-1 text-yellow-700">
                  This step was suggested by AI. Please verify requirements with your local Auslaenderbehoerde.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <CompleteStepButton
                slug={step.slug}
                isCompleted={isCompleted}
                disabled={(['blocked'] as StepStatus[]).includes(status)}
              />
              <Link
                href={`/roadmap/${step.slug}`}
                className="text-sm text-blue-700 hover:text-blue-800 font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
