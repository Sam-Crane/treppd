'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ThumbsDown, ThumbsUp } from 'lucide-react';

import { api } from '@/lib/api';

interface FeedbackButtonsProps {
  logId: string;
}

export function FeedbackButtons({ logId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<'up' | 'down' | null>(null);

  async function send(rating: 1 | -1) {
    if (submitted) return;
    setSubmitted(rating === 1 ? 'up' : 'down');
    try {
      await api.post('/chat/feedback', { log_id: logId, rating });
    } catch {
      setSubmitted(null);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1 text-xs text-text-muted"
      >
        <Check className="h-3.5 w-3.5 text-success" />
        Thanks for the feedback
      </motion.div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => send(1)}
        aria-label="This was helpful"
        className="rounded p-1 text-text-muted transition-colors hover:bg-subtle hover:text-success"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => send(-1)}
        aria-label="This was not helpful"
        className="rounded p-1 text-text-muted transition-colors hover:bg-subtle hover:text-error"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
