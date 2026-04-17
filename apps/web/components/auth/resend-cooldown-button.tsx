'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RotateCw } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ResendCooldownButtonProps {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
  label?: string;
  labelDuringCooldown?: (seconds: number) => string;
  className?: string;
}

export function ResendCooldownButton({
  onResend,
  cooldownSeconds = 60,
  label = 'Resend email',
  labelDuringCooldown = (s) => `Resend available in ${s}s`,
  className = '',
}: ResendCooldownButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  async function handleClick() {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      await onResend();
      setCooldown(cooldownSeconds);
    } finally {
      setIsSending(false);
    }
  }

  const disabled = cooldown > 0 || isSending;
  const progressPercent = cooldown > 0 ? (cooldown / cooldownSeconds) * 100 : 0;

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
        disabled
          ? 'cursor-not-allowed border-border-default bg-subtle text-text-muted'
          : 'border-accent/30 bg-surface text-accent hover:bg-accent-subtle',
        className,
      )}
    >
      {cooldown > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-accent/10 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCw className="h-4 w-4" />
        )}
        {cooldown > 0 ? labelDuringCooldown(cooldown) : label}
      </span>
    </motion.button>
  );
}
