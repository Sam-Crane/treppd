'use client';

import { useState } from 'react';
import { Sparkles, Download } from 'lucide-react';

import { formsApi } from '@/lib/forms-api';

export function AutofillPanel({ formCode }: { formCode: string }) {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAutofill() {
    setBusy(true);
    setError(null);
    try {
      const res = await formsApi.autofill(formCode);
      setValues(res.values);
    } catch {
      setError('Could not autofill. Complete onboarding first.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    setBusy(true);
    setError(null);
    try {
      const { pdf_base64, filename } = await formsApi.generatePdf(formCode);
      const bytes = Uint8Array.from(atob(pdf_base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(
        new Blob([bytes], { type: 'application/pdf' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not generate the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
        <Sparkles className="h-4 w-4 text-blue-500" />
        Autofill &amp; download
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Pre-fill from your profile, review every value, then download a
        preparation summary to transcribe onto the official form.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={loadAutofill}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-slate-600"
        >
          Autofill from my profile
        </button>
        <button
          onClick={downloadPdf}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download filled PDF
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {values && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Review before downloading
          </p>
          <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {Object.entries(values).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-1.5 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right text-slate-900 dark:text-slate-100">
                  {v || <span className="text-slate-400">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="mt-4 text-[11px] text-slate-400">
        This produces a Treppd preparation summary, not an official form.
        Educational guidance, not legal advice.
      </p>
    </section>
  );
}
