'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
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
      // Best-effort; revert UI on failure
      setSubmitted(null);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1 text-xs text-gray-500"
      >
        <Check className="w-3.5 h-3.5 text-green-600" />
        Thanks for the feedback
      </motion.div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => send(1)}
        aria-label="This was helpful"
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => send(-1)}
        aria-label="This was not helpful"
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
