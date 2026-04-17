'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  Map,
  Mail,
  Sparkles,
} from 'lucide-react';

import { api } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  ProgressBar,
  ProgressRing,
  Skeleton,
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface RoadmapStep {
  slug: string;
  title: string;
  office: string;
  estimated_days: number;
  completed: boolean;
  deadline?: string;
}

interface RoadmapData {
  steps: RoadmapStep[];
}

interface ProgressData {
  total: number;
  completed: number;
  percentage: number;
}

function daysUntil(iso: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-60 rounded-2xl" />
    </div>
  );
}

function PhaseBadge({ percentage }: { percentage: number }) {
  // Light gamification: three phases based on overall progress
  const phase =
    percentage < 30
      ? { label: 'Arrival', color: 'info' as const, emoji: '🛬' }
      : percentage < 70
        ? { label: 'Settling', color: 'warning' as const, emoji: '🏡' }
        : { label: 'Integrated', color: 'success' as const, emoji: '✨' };
  return (
    <Badge variant={phase.color} size="lg">
      <span aria-hidden="true">{phase.emoji}</span>
      {phase.label}
    </Badge>
  );
}

function QuickTile({
  href,
  icon: Icon,
  label,
  description,
  delay,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Link
        href={href}
        className="group block rounded-xl border border-border-default bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">{label}</p>
            <p className="truncate text-xs text-text-muted">{description}</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const roadmapQuery = useQuery<RoadmapData>({
    queryKey: ['roadmap'],
    queryFn: () => api.get('/roadmap'),
    retry: (failureCount, error) => {
      if (error.message.includes('404')) return false;
      return failureCount < 1;
    },
  });

  const progressQuery = useQuery<ProgressData>({
    queryKey: ['progress'],
    queryFn: () => api.get('/roadmap/progress'),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/roadmap/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  if (roadmapQuery.isLoading || progressQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  const hasNoRoadmap =
    roadmapQuery.isError ||
    !roadmapQuery.data ||
    !roadmapQuery.data.steps ||
    roadmapQuery.data.steps.length === 0;

  if (hasNoRoadmap) {
    return (
      <EmptyState
        icon={Compass}
        title="Generate your first roadmap"
        description="We'll build a personalised step-by-step journey based on your visa type, Bundesland, and goal. Takes under 10 seconds."
        action={
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              size="lg"
            >
              {generateMutation.isPending
                ? 'Generating your roadmap…'
                : 'Generate Roadmap'}
              {!generateMutation.isPending && (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
            {generateMutation.isError && (
              <span className="flex items-center gap-1 text-xs text-error">
                <AlertTriangle className="h-3.5 w-3.5" />
                Couldn&apos;t generate roadmap. Please try again.
              </span>
            )}
          </div>
        }
      />
    );
  }

  const progress = progressQuery.data;
  const steps = roadmapQuery.data?.steps ?? [];
  const incompleteSteps = steps.filter((s) => !s.completed);
  const upcomingSteps = incompleteSteps.slice(0, 3);
  const completedCount = progress?.completed ?? 0;
  const totalCount = progress?.total ?? steps.length;
  const pct = progress?.percentage ?? 0;

  const nextDeadline = steps
    .filter((s) => !s.completed && s.deadline)
    .sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
    )[0];

  const daysRemaining = nextDeadline ? daysUntil(nextDeadline.deadline!) : null;
  const urgent = daysRemaining !== null && daysRemaining <= 7;
  const soon = daysRemaining !== null && daysRemaining <= 30;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your immigration roadmap"
        description="Track progress, see what's next, and stay ahead of deadlines."
        actions={<PhaseBadge percentage={pct} />}
      />

      {/* Hero row: big progress ring + next action tiles */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Big progress card */}
        <Card padding="lg" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent"
          />
          <div className="relative flex flex-col items-center gap-4">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Overall progress
            </span>
            <ProgressRing
              value={pct}
              size={140}
              strokeWidth={10}
              sublabel={`${completedCount} of ${totalCount} steps`}
            />
            <ProgressBar
              value={pct}
              className="w-full"
              size="sm"
              label="Roadmap"
            />
          </div>
        </Card>

        {/* Next deadline */}
        <Card padding="lg" className="flex flex-col">
          <CardHeader>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Next deadline
            </span>
          </CardHeader>
          {nextDeadline ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full',
                  urgent
                    ? 'bg-red-100 text-error dark:bg-red-950/60'
                    : soon
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-accent-subtle text-accent-hover dark:text-accent',
                )}
              >
                <Clock className="h-6 w-6" />
              </div>
              <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-text-primary">
                {daysRemaining}
              </p>
              <p className="text-xs text-text-muted">
                {daysRemaining === 1 ? 'day remaining' : 'days remaining'}
              </p>
              <p className="mt-3 line-clamp-2 text-sm font-medium text-text-primary">
                {nextDeadline.title}
              </p>
              {urgent && (
                <Badge variant="error" className="mt-3">
                  <AlertTriangle className="h-3 w-3" />
                  Act now
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
              <Calendar className="h-10 w-10 text-text-muted/50" />
              <p className="text-sm text-text-muted">No upcoming deadlines</p>
              <p className="text-xs text-text-muted">You&apos;re all caught up.</p>
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card padding="lg" className="flex flex-col gap-3">
          <CardHeader>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Quick actions
            </span>
          </CardHeader>
          <div className="flex flex-col gap-2">
            <QuickTile
              href="/roadmap"
              icon={Map}
              label="Full roadmap"
              description="All steps + dependencies"
              delay={0.05}
            />
            <QuickTile
              href="/documents"
              icon={FileText}
              label="Document checklist"
              description="Upload what's required"
              delay={0.1}
            />
            <QuickTile
              href="/appointments"
              icon={Mail}
              label="Book an appointment"
              description="Generate a German email"
              delay={0.15}
            />
          </div>
        </Card>
      </div>

      {/* Upcoming steps */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Upcoming steps
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/roadmap">
              See all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {upcomingSteps.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All done for now"
            description="You've completed every step on your roadmap. Nice work."
          />
        ) : (
          <div className="grid gap-2">
            {upcomingSteps.map((step, i) => (
              <motion.div
                key={step.slug}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <Link
                  href={`/roadmap#${step.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-border-default bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-subtle font-mono text-xs font-semibold text-accent-hover dark:text-accent">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {step.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {step.office} · ~{step.estimated_days} days
                    </p>
                  </div>
                  {step.deadline && (
                    <div className="hidden flex-shrink-0 text-right sm:block">
                      <p className="font-mono text-sm font-medium text-text-primary">
                        {daysUntil(step.deadline)}d
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">
                        remaining
                      </p>
                    </div>
                  )}
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-text-muted" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Feature grid — light ads for the other surfaces */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card variant="interactive" padding="md">
          <Link href="/forms" className="block">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Form guides</CardTitle>
                <CardDescription>
                  Walk through Anmeldung + residence-permit forms field by field
                </CardDescription>
              </div>
            </div>
          </Link>
        </Card>
        <Card variant="interactive" padding="md">
          <Link href="/appointments" className="block">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Appointment emails</CardTitle>
                <CardDescription>
                  Generate formal German booking emails in seconds
                </CardDescription>
              </div>
            </div>
          </Link>
        </Card>
        <Card variant="interactive" padding="md">
          <Link href="/settings" className="block">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Deadline alerts</CardTitle>
                <CardDescription>
                  Turn on push notifications for visa + Anmeldung deadlines
                </CardDescription>
              </div>
            </div>
          </Link>
        </Card>
      </section>
    </div>
  );
}
