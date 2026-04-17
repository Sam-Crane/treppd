'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FileText, MapPin, Calendar, ArrowRight } from 'lucide-react';

import { formsApi, type FormSummary } from '@/lib/forms-api';

const BUNDESLAND_NAMES: Record<string, string> = {
  'DE-BW': 'Baden-Württemberg',
  'DE-BY': 'Bavaria',
  'DE-BE': 'Berlin',
  'DE-BB': 'Brandenburg',
  'DE-HB': 'Bremen',
  'DE-HH': 'Hamburg',
  'DE-HE': 'Hesse',
  'DE-MV': 'Mecklenburg-Vorpommern',
  'DE-NI': 'Lower Saxony',
  'DE-NW': 'North Rhine-Westphalia',
  'DE-RP': 'Rhineland-Palatinate',
  'DE-SL': 'Saarland',
  'DE-SN': 'Saxony',
  'DE-ST': 'Saxony-Anhalt',
  'DE-SH': 'Schleswig-Holstein',
  'DE-TH': 'Thuringia',
};

function prettyBundesland(codes: string[]): string {
  if (codes.length === 0) return 'All Bundesländer';
  return codes.map((c) => BUNDESLAND_NAMES[c] ?? c).join(', ');
}

function FormCard({ form, index }: { form: FormSummary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link
        href={`/forms/${form.form_code}`}
        className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500"
      >
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-400" />
        </div>

        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          {form.name_en}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {form.name_de}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <MapPin className="h-3 w-3" />
            {prettyBundesland(form.bundeslaender)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {form.field_count} fields
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Calendar className="h-3 w-3" />
            Verified {form.verified_at}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        No forms are applicable to your current profile yet.
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        We add new Bundesland and visa-type coverage regularly — check back soon.
      </p>
    </div>
  );
}

export function FormsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['forms-list'],
    queryFn: formsApi.list,
  });

  if (isLoading) return <LoadingCards />;
  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        Couldn&rsquo;t load your forms. Please reload the page in a moment.
      </div>
    );
  }
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((form, i) => (
        <FormCard key={form.id} form={form} index={i} />
      ))}
    </div>
  );
}
