'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
} from 'lucide-react';

import { formsApi } from '@/lib/forms-api';
import { FieldCard } from './field-card';

type FieldValue = string | number | boolean;
type ValueMap = Record<string, FieldValue>;

const DEBOUNCE_MS = 800;

function useDebouncedSave(
  formCode: string,
  values: ValueMap,
  enabled: boolean,
) {
  const saveMutation = useMutation({
    mutationFn: (v: ValueMap) => formsApi.saveSession(formCode, v),
  });

  const lastSentRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const serialised = JSON.stringify(values);
    if (serialised === lastSentRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastSentRef.current = serialised;
      saveMutation.mutate(values);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // saveMutation is stable-ish from react-query; safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, enabled, formCode]);

  return saveMutation;
}

function ProgressBar({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>
          {filled} of {total} fields filled
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SaveIndicator({
  pending,
  done,
  errored,
  lastSavedAt,
}: {
  pending: boolean;
  done: boolean;
  errored: boolean;
  lastSavedAt: string | null;
}) {
  if (errored) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        Save failed &mdash; will retry
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Save className="h-3.5 w-3.5 animate-pulse" />
        Saving…
      </span>
    );
  }
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Progress saved
      </span>
    );
  }
  if (lastSavedAt) {
    const d = new Date(lastSavedAt);
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        Last saved {d.toLocaleString()}
      </span>
    );
  }
  return null;
}

export function FormGuide({ formCode }: { formCode: string }) {
  const formQuery = useQuery({
    queryKey: ['form', formCode],
    queryFn: () => formsApi.get(formCode),
  });
  const sessionQuery = useQuery({
    queryKey: ['form-session', formCode],
    queryFn: () => formsApi.getSession(formCode),
  });

  const [values, setValues] = useState<ValueMap>({});
  const [hydrated, setHydrated] = useState(false);

  // One-time hydration from the saved session — don't overwrite user typing.
  useEffect(() => {
    if (!hydrated && sessionQuery.data) {
      setValues(sessionQuery.data.values ?? {});
      setHydrated(true);
    }
  }, [sessionQuery.data, hydrated]);

  const saveMutation = useDebouncedSave(formCode, values, hydrated);

  const handleChange = useCallback((fieldId: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const filledCount = useMemo(() => {
    if (!formQuery.data) return 0;
    return formQuery.data.fields.reduce((n, f) => {
      const v = values[f.field_id];
      if (f.input_type === 'checkbox') return n + (v === true ? 1 : 0);
      return n + (v !== undefined && v !== '' && v !== null ? 1 : 0);
    }, 0);
  }, [formQuery.data, values]);

  if (formQuery.isLoading || sessionQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-900" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-900" />
      </div>
    );
  }

  if (formQuery.isError || !formQuery.data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        This form isn&rsquo;t available for your profile, or the link is
        invalid.{' '}
        <Link href="/forms" className="underline">
          Back to form list
        </Link>
        .
      </div>
    );
  }

  const form = formQuery.data;
  const total = form.fields.length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/forms"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All forms
        </Link>

        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {form.name_en}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {form.name_de}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Verified {form.verified_at}
          </span>
          {form.download_url && (
            <a
              href={form.download_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
            >
              Official page
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <SaveIndicator
            pending={saveMutation.isPending}
            done={saveMutation.isSuccess && !saveMutation.isPending}
            errored={saveMutation.isError}
            lastSavedAt={
              saveMutation.data?.updated_at ??
              sessionQuery.data?.updated_at ??
              null
            }
          />
        </div>

        <div className="mt-4">
          <ProgressBar filled={filledCount} total={total} />
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          This is educational guidance, not legal advice. Always confirm
          requirements with your local Ausländerbehörde or a qualified
          immigration lawyer.
        </p>
      </div>

      <div className="space-y-3">
        {form.fields.map((field, i) => (
          <FieldCard
            key={field.field_id}
            field={field}
            formCode={formCode}
            value={values[field.field_id] ?? ''}
            onChange={(v) => handleChange(field.field_id, v)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
