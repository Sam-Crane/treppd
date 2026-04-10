'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Zap, Map, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { StepCard } from '@/components/roadmap/step-card';

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

function ProgressBar({ progress }: { progress: ProgressResponse }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Your Progress</h2>
        <span className="text-sm font-medium text-[#1a365d]">
          {progress.completed} / {progress.total_steps} steps
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1a365d] to-blue-500 transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {progress.percentage}% complete
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border p-5">
        <div className="h-4 bg-gray-200 rounded w-40 mb-3" />
        <div className="h-3 bg-gray-200 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded w-20 mt-2" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border p-5">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="flex gap-3">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RoadmapPage() {
  const queryClient = useQueryClient();

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
    queryFn: () => api.get<{ completed_steps: string[] }>('/profiles/me'),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<RoadmapResponse>('/roadmap/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const completedSteps = profile?.completed_steps ?? [];
  const isLoading = roadmapLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Your Roadmap
          </h1>
          <p className="text-gray-500 mt-1">
            Loading your immigration roadmap...
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (roadmapError || !roadmap || roadmap.steps.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Your Roadmap
          </h1>
          <p className="text-gray-500 mt-1">
            Your personalized step-by-step immigration guide.
          </p>
        </div>

        <div className="bg-white rounded-xl border p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-[#1a365d]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Roadmap Yet
          </h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Generate your personalized immigration roadmap based on your visa
            type and situation. Our AI will create a step-by-step plan tailored
            to your needs.
          </p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-[#1a365d]/90 transition-colors disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Generate Roadmap
          </button>
          {generateMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Failed to generate roadmap. Please try again.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Your Roadmap
          </h1>
          <p className="text-gray-500 mt-1">
            Follow these steps to complete your immigration process.
          </p>
        </div>
        {roadmap.ai_enriched && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered
          </span>
        )}
        {roadmap.ai_fallback && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
            <Zap className="w-3.5 h-3.5" />
            Basic mode
          </span>
        )}
      </div>

      {progress && <ProgressBar progress={progress} />}

      <div className="space-y-3">
        {roadmap.steps.map((step) => {
          const status = getStepStatus(step, completedSteps);
          return (
            <StepCard
              key={step.slug}
              step={step}
              status={status}
              isCompleted={completedSteps.includes(step.slug)}
            />
          );
        })}
      </div>
    </div>
  );
}
