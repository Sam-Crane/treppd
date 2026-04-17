'use client';

import { motion } from 'framer-motion';
import { Building2, Check } from 'lucide-react';

import { PROCESS_OPTIONS, type ProcessType } from '@/lib/appointments-api';

export function ProcessTypePicker({
  value,
  onChange,
}: {
  value: ProcessType | null;
  onChange: (v: ProcessType) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PROCESS_OPTIONS.map((option, i) => {
        const selected = value === option.key;
        return (
          <motion.button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            whileTap={{ scale: 0.985 }}
            className={[
              'group relative rounded-2xl border p-4 text-left transition',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              selected
                ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-400 dark:border-blue-400 dark:bg-blue-950/40 dark:ring-blue-500'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {option.label_en}
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {option.label_de}
                </p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {option.description}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
                  {option.office}
                </p>
              </div>
              <span
                className={[
                  'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border',
                  selected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800',
                ].join(' ')}
                aria-hidden="true"
              >
                {selected && <Check className="h-3 w-3" />}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
