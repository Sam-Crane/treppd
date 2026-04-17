'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Info,
  Loader2,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { useCallback, useState } from 'react';

import {
  formsApi,
  type FieldExplanation,
  type FormField,
} from '@/lib/forms-api';

type FieldValue = string | number | boolean;

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
}) {
  const base =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-blue-400 dark:focus:ring-blue-900';

  switch (field.input_type) {
    case 'date':
      return (
        <input
          type="date"
          className={base}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'checkbox':
      return (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(e.target.checked)}
          />
          Yes
        </label>
      );
    case 'number':
      // Coerce boolean or missing to a safe string for the input DOM type.
      return (
        <input
          type="number"
          inputMode="numeric"
          className={base}
          value={typeof value === 'number' ? value : ''}
          placeholder={field.example_value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? '' : Number(v));
          }}
        />
      );
    case 'select':
      // Seed migration doesn't ship a discrete option list yet — treat as
      // free-text hint so the user can type the value from the form FAQ.
      return (
        <input
          type="text"
          className={base}
          value={String(value ?? '')}
          placeholder={field.example_value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          className={base}
          value={String(value ?? '')}
          placeholder={field.example_value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function AIExplanationPanel({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string | null;
  data: FieldExplanation | null;
}) {
  return (
    <AnimatePresence>
      {(loading || error || data) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI explanation (personalised to your profile)
            </div>
            {loading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </div>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
            {data && !loading && !error && (
              <div className="mt-2 space-y-2">
                <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {data.explanation}
                  </ReactMarkdown>
                </div>
                {data.tips.length > 0 && (
                  <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                    {data.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                )}
                {data.example && (
                  <p className="text-xs italic text-slate-600 dark:text-slate-400">
                    Example value: <span className="font-mono">{data.example}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FieldCard({
  field,
  formCode,
  value,
  onChange,
  index,
}: {
  field: FormField;
  formCode: string;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  index: number;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<FieldExplanation | null>(null);

  const askAI = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    setAiData(null);
    try {
      const response = await formsApi.explainField(formCode, field.field_id);
      setAiData(response);
    } catch {
      setAiError(
        'Couldn\u2019t load the explanation right now. Please try again.',
      );
    } finally {
      setAiLoading(false);
    }
  }, [formCode, field.field_id]);

  const isFilled =
    field.input_type === 'checkbox'
      ? value === true || value === 'true'
      : value !== '' && value !== undefined && value !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {field.label_en}
              {field.required && (
                <span className="ml-1 text-red-500" aria-label="required">
                  *
                </span>
              )}
            </h3>
            {isFilled && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Check className="h-3 w-3" />
                Filled
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {field.label_de}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <FieldInput field={field} value={value} onChange={onChange} />
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
        <p>{field.instructions_en}</p>
      </div>

      {field.common_mistakes.length > 0 && (
        <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Common mistakes</p>
            <ul className="mt-0.5 list-inside list-disc space-y-0.5">
              {field.common_mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {field.example_value && (
        <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
          Example: <span className="font-mono">{field.example_value}</span>
        </p>
      )}

      {field.ai_can_explain && (
        <button
          type="button"
          onClick={askAI}
          disabled={aiLoading}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {aiData ? 'Refresh AI explanation' : 'Ask AI'}
        </button>
      )}

      <AIExplanationPanel
        loading={aiLoading}
        error={aiError}
        data={aiData}
      />
    </motion.div>
  );
}
