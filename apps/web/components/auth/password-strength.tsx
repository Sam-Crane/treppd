'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const passedCount = requirements.filter((r) => r.test(password)).length;
  const strength = (passedCount / requirements.length) * 100;

  const strengthColor =
    strength < 50
      ? 'bg-red-400'
      : strength < 75
        ? 'bg-amber-400'
        : strength < 100
          ? 'bg-lime-400'
          : 'bg-green-500';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-2 overflow-hidden"
      >
        <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full ${strengthColor}`}
          />
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-1.5">
          {requirements.map((req) => {
            const passed = req.test(password);
            return (
              <li
                key={req.label}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  passed ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    passed ? 'text-green-600' : 'text-gray-300'
                  }`}
                />
                <span>{req.label}</span>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}
