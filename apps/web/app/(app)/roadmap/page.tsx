'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Map, Sparkles, Zap } from 'lucide-react';

import { api } from '@/lib/api';
import { StepCard } from '@/components/roadmap/step-card';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  Skeleton,
} from '@/components/ui';
import {
  PhaseBadgeLarge,
  phaseFromProgress,
} from '@/components/gamification/phase-badge';
import { MilestoneCelebration } from '@/components/gamification/milestone-celebration';

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

interface ProgressResponse {
  total_steps: number;
  completed: number;
  percentage: number;
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
    <div className="space-y-4">
      <Skeleton className="h-24 rounded-2xl" />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

export default function RoadmapPage() {
  const queryClient = useQueryClient();
  const [celebration, setCelebration] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const prevCompletedRef = useRef<Set<string>>(new Set());

  const {
    data: roadmap,
    isLoading: roadmapLoading,
    error: roadmapError,
  } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => api.get<RoadmapResponse>('/roadmap'),
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get<ProgressResponse>('/roadmap/progress'),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () =>
      api.get<{
        completed_steps: string[];
        visa_type?: string;
        bundesland?: string;
      }>('/profiles/me'),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<RoadmapResponse>('/roadmap/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const completedSteps = useMemo(
    () => profile?.completed_steps ?? [],
    [profile?.completed_steps],
  );

  // Detect newly-completed steps and trigger celebration. The set-based
  // diff avoids re-firing for steps that were already completed on mount.
  useEffect(() => {
    if (!roadmap) return;
    const seen = prevCompletedRef.current;
    // On first mount (empty seen set), seed without firing celebrations —
    // we only celebrate transitions that happen while the user is here.
    if (seen.size === 0 && completedSteps.length > 0) {
      completedSteps.forEach((slug) => seen.add(slug));
      return;
    }
    for (const slug of completedSteps) {
      if (!seen.has(slug)) {
        const step = roadmap.steps.find((s) => s.slug === slug);
        if (step) {
          setCelebration({
            title: 'Step complete!',
            body: `${step.title} — one fewer thing standing between you and settled in Germany.`,
          });
        }
        seen.add(slug);
      }
    }
  }, [completedSteps, roadmap]);

  const isLoading = roadmapLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Map className="h-6 w-6" />}
          title="Your roadmap"
          description="Loading your personalised step-by-step immigration plan…"
        />
        <LoadingSkeleton />
      </div>
    );
  }

  if (roadmapError || !roadmap || roadmap.steps.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Map className="h-6 w-6" />}
          title="Your roadmap"
          description="A personalised step-by-step immigration plan tailored to your situation."
        />
        <EmptyState
          icon={Map}
          title="No roadmap yet"
          description="Generate your personalised immigration roadmap based on your visa type and situation. Claude will create a step-by-step plan tailored to your needs in under 10 seconds."
          action={
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => generateMutation.mutate()}
                loading={generateMutation.isPending}
                size="lg"
              >
                {generateMutation.isPending ? (
                  'Generating…'
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate roadmap
                  </>
                )}
              </Button>
              {generateMutation.isError && (
                <p className="text-sm text-error">
                  Failed to generate roadmap. Please try again.
                </p>
              )}
            </div>
          }
        />
      </div>
    );
  }

  const pct = progress?.percentage ?? 0;
  const total = progress?.total_steps ?? roadmap.steps.length;
  const completedCount = progress?.completed ?? completedSteps.length;
  const phase = phaseFromProgress(pct);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Map className="h-6 w-6" />}
        title="Your roadmap"
        description="Follow these steps in order. Tap any step for details, documents, and tips."
        actions={
          <div className="flex items-center gap-2">
            {roadmap.ai_enriched && (
              <Badge variant="info">
                <Sparkles className="h-3 w-3" />
                AI-enriched
              </Badge>
            )}
            {roadmap.ai_fallback && (
              <Badge variant="warning">
                <Zap className="h-3 w-3" />
                Basic mode
              </Badge>
            )}
          </div>
        }
      />

      {/* Progress + phase */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Progress
              </p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {completedCount} of {total} steps complete
              </p>
            </div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-text-primary">
              {pct}%
            </p>
          </div>
          <ProgressBar value={pct} size="lg" className="mt-4" />
        </Card>

        <PhaseBadgeLarge phase={phase} />
      </div>

      {/* Step list */}
      <div className="space-y-3">
        {roadmap.steps.map((step, i) => {
          const status = getStepStatus(step, completedSteps);
          return (
            <motion.div
              key={step.slug}
              id={step.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <StepCard
                step={step}
                status={status}
                isCompleted={completedSteps.includes(step.slug)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Call-to-continue at bottom */}
      {completedCount > 0 && completedCount < total && (
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-accent-hover dark:text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text-primary">
            {total - completedCount} steps left
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Keep going — {phase === 'arrival' ? 'you&apos;ve just started' : phase === 'settling' ? 'you&apos;re over half way' : 'you&apos;re almost there'}.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <a href="#top">
              Back to top
              <ArrowRight className="h-3 w-3 rotate-[-90deg]" />
            </a>
          </Button>
        </Card>
      )}

      <MilestoneCelebration
        open={celebration !== null}
        title={celebration?.title ?? ''}
        body={celebration?.body}
        actionLabel="Keep going"
        onDismiss={() => setCelebration(null)}
      />
    </div>
  );
}
