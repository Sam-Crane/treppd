'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';

export function GeneratedEmailPanel({
  subject,
  body,
  officeEmail,
  onRegenerate,
  regenerating,
}: {
  subject: string;
  body: string;
  officeEmail?: string;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [copied, setCopied] = useState<'subject' | 'body' | 'both' | null>(
    null,
  );

  const copyTo = useCallback(
    async (text: string, kind: 'subject' | 'body' | 'both') => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(kind);
        setTimeout(() => setCopied(null), 1500);
      } catch {
        // Clipboard API is sometimes blocked — silent fail, user can select text manually
      }
    },
    [],
  );

  const combined = `Subject: ${subject}\n\n${body}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Your email draft (in German)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw
              className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`}
            />
            Re-generate
          </button>
          <button
            type="button"
            onClick={() => copyTo(combined, 'both')}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied === 'both' ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Copied
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy all
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject
          </span>
          <button
            type="button"
            onClick={() => copyTo(subject, 'subject')}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {copied === 'subject' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100">
          {subject}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Body
          </span>
          <button
            type="button"
            onClick={() => copyTo(body, 'body')}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {copied === 'body' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="mt-1 max-h-[400px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-3 font-sans text-sm leading-relaxed text-slate-900 dark:bg-slate-800 dark:text-slate-100">
{body}
        </pre>
      </section>

      {officeEmail && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Send to:{' '}
          <a
            href={`mailto:${officeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
            className="font-mono text-blue-600 hover:underline dark:text-blue-400"
          >
            {officeEmail}
          </a>
        </p>
      )}

      <p className="text-xs italic text-slate-500 dark:text-slate-400">
        Review carefully before sending. This draft is educational guidance,
        not legal advice.
      </p>
    </motion.div>
  );
}
