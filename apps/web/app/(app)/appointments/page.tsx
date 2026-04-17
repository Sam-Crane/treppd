'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Mail } from 'lucide-react';

import {
  appointmentsApi,
  type GeneratedEmail,
  type OfficeDetails,
  type ProcessType,
} from '@/lib/appointments-api';
import { ProcessTypePicker } from '@/components/appointments/process-type-picker';
import { OfficeDetailsForm } from '@/components/appointments/office-details-form';
import { GeneratedEmailPanel } from '@/components/appointments/generated-email-panel';

export default function AppointmentsPage() {
  const [processType, setProcessType] = useState<ProcessType | null>(null);
  const [office, setOffice] = useState<OfficeDetails>({
    name: '',
    email: '',
    phone: '',
    requested_dates: [],
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate =
    processType !== null &&
    office.name.trim().length > 0 &&
    /@/.test(office.email);

  async function handleGenerate() {
    if (!processType) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await appointmentsApi.generate({
        process_type: processType,
        office_details: {
          name: office.name.trim(),
          email: office.email.trim(),
          phone: office.phone?.trim() || undefined,
          requested_dates:
            (office.requested_dates ?? []).filter(Boolean).length > 0
              ? (office.requested_dates ?? []).filter(Boolean)
              : undefined,
        },
      });
      setResult(response);
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes('429')
          ? 'You\u2019ve generated a lot of emails this hour \u2014 please try again in a bit.'
          : 'Couldn\u2019t generate the email right now. Please try again.',
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <Mail className="h-6 w-6 text-blue-500" />
          Appointment email generator
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Need to request an appointment from the Ausländerbehörde or
          Einwohnermeldeamt? We\u2019ll draft the email in correct formal
          German. Review it, copy, and send.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            1
          </span>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            What is the appointment for?
          </h2>
        </div>
        <ProcessTypePicker value={processType} onChange={setProcessType} />
      </motion.section>

      {processType && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              2
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Office details
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <OfficeDetailsForm value={office} onChange={setOffice} />
          </div>
        </motion.section>
      )}

      {processType && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>Generate email</>
            )}
          </button>
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              {error}
            </span>
          )}
        </motion.div>
      )}

      {result && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              3
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Draft ready — review + send
            </h2>
          </div>
          <GeneratedEmailPanel
            subject={result.subject}
            body={result.body}
            officeEmail={office.email}
            onRegenerate={handleGenerate}
            regenerating={generating}
          />
        </motion.section>
      )}
    </div>
  );
}
