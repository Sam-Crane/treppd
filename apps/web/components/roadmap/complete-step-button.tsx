'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CompleteStepButtonProps {
  slug: string;
  isCompleted: boolean;
  disabled?: boolean;
}

export function CompleteStepButton({
  slug,
  isCompleted,
  disabled = false,
}: CompleteStepButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/roadmap/steps/${slug}/complete`, {
        completed: !isCompleted,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  if (isCompleted) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          mutation.mutate();
        }}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
      >
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Completed
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
      disabled={disabled || mutation.isPending}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1a365d] hover:bg-[#1a365d]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {mutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      Mark Complete
    </button>
  );
}
