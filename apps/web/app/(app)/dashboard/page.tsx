'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProgressCircle } from '@/components/dashboard/progress-circle';
import { UpcomingSteps } from '@/components/dashboard/upcoming-steps';
import {
  Clock,
  FileText,
  Map,
  AlertTriangle,
} from 'lucide-react';

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

export default function DashboardPage() {
  const roadmapQuery = useQuery<RoadmapData>({
    queryKey: ['roadmap'],
    queryFn: () => api.get('/roadmap'),
  });

  const progressQuery = useQuery<ProgressData>({
    queryKey: ['progress'],
    queryFn: () => api.get('/roadmap/progress'),
  });

  const isLoading = roadmapQuery.isLoading || progressQuery.isLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const progress = progressQuery.data;
  const steps = roadmapQuery.data?.steps || [];
  const incompleteSteps = steps.filter((s) => !s.completed);
  const upcomingSteps = incompleteSteps.slice(0, 3);

  const nextDeadline = steps
    .filter((s) => !s.completed && s.deadline)
    .sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
    )[0];

  const daysRemaining = nextDeadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextDeadline.deadline!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Your Immigration Roadmap
        </h1>
        <p className="mt-1 text-gray-500">
          Track your progress through German bureaucracy, step by step.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress */}
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Overall Progress
          </h2>
          <ProgressCircle percentage={progress?.percentage ?? 0} />
          <p className="mt-4 text-sm text-gray-500">
            {progress?.completed ?? 0} of {progress?.total ?? 0} steps
            completed
          </p>
        </div>

        {/* Next Deadline */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Next Deadline
          </h2>
          {nextDeadline ? (
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  daysRemaining !== null && daysRemaining <= 7
                    ? 'bg-red-100 text-red-600'
                    : daysRemaining !== null && daysRemaining <= 30
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-[#1a365d]'
                }`}
              >
                <Clock className="h-7 w-7" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
              </p>
              <p className="mt-1 text-sm text-gray-500">remaining</p>
              <p className="mt-3 text-sm font-medium text-gray-700">
                {nextDeadline.title}
              </p>
              {daysRemaining !== null && daysRemaining <= 7 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Urgent - action needed soon
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <Clock className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No upcoming deadlines
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/roadmap"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1a365d]">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  View Full Roadmap
                </p>
                <p className="text-xs text-gray-500">
                  See all steps in detail
                </p>
              </div>
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1a365d]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Check Documents
                </p>
                <p className="text-xs text-gray-500">
                  Review required paperwork
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Steps */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Upcoming Steps
        </h2>
        <UpcomingSteps steps={upcomingSteps} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-gray-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>

      <div>
        <div className="mb-4 h-7 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
