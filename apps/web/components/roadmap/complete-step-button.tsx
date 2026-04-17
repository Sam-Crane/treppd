'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';

import { api } from '@/lib/api';
import { Button } from '@/components/ui';

interface CompleteStepButtonProps {
  slug: string;
  isCompleted: boolean;
  disabled?: boolean;
}

interface ProfileData {
  completed_steps: string[];
  [key: string]: unknown;
}

interface MutationContext {
  previousProfile: ProfileData | undefined;
}

export function CompleteStepButton({
  slug,
  isCompleted,
  disabled = false,
}: CompleteStepButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, void, MutationContext>({
    mutationFn: () =>
      api.patch(`/roadmap/steps/${slug}/complete`, {
        completed: !isCompleted,
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previousProfile =
        queryClient.getQueryData<ProfileData>(['profile']);

      if (previousProfile) {
        const current = Array.isArray(previousProfile.completed_steps)
          ? previousProfile.completed_steps
          : [];
        const next = isCompleted
          ? current.filter((s) => s !== slug)
          : current.includes(slug)
            ? current
            : [...current, slug];

        queryClient.setQueryData<ProfileData>(['profile'], {
          ...previousProfile,
          completed_steps: next,
        });
      }
      return { previousProfile };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return (
    <Button
      variant={isCompleted ? 'secondary' : 'primary'}
      size="sm"
      loading={mutation.isPending}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      {!mutation.isPending && <CheckCircle2 className="h-4 w-4" />}
      {isCompleted ? 'Completed' : 'Mark Complete'}
    </Button>
  );
}
