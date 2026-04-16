'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RotateCw } from 'lucide-react';

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
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
        disabled
          ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
          : 'bg-white text-[#1a365d] border-[#1a365d]/20 hover:bg-blue-50'
      } ${className}`}
    >
      {cooldown > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-blue-100/60 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCw className="w-4 h-4" />
        )}
        {cooldown > 0 ? labelDuringCooldown(cooldown) : label}
      </span>
    </motion.button>
  );
}
