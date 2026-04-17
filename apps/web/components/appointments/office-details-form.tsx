'use client';

import { Calendar, Mail, MapPin, Phone } from 'lucide-react';

import type { OfficeDetails } from '@/lib/appointments-api';

export function OfficeDetailsForm({
  value,
  onChange,
}: {
  value: OfficeDetails;
  onChange: (v: OfficeDetails) => void;
}) {
  const input =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-blue-400 dark:focus:ring-blue-900';

  const label = 'text-xs font-medium text-slate-700 dark:text-slate-300';

  const setDate = (index: number, iso: string) => {
    const next = [...(value.requested_dates ?? [])];
    next[index] = iso;
    onChange({
      ...value,
      requested_dates: next.filter(Boolean),
    });
  };

  const dates = value.requested_dates ?? [];

  return (
    <div className="space-y-4">
      <div>
        <label className={label} htmlFor="office-name">
          <MapPin className="mr-1 inline h-3 w-3" /> Office name
          <span className="ml-1 text-red-500">*</span>
        </label>
        <input
          id="office-name"
          type="text"
          className={`mt-1 ${input}`}
          placeholder="e.g. Kreisverwaltungsreferat München"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>

      <div>
        <label className={label} htmlFor="office-email">
          <Mail className="mr-1 inline h-3 w-3" /> Office email
          <span className="ml-1 text-red-500">*</span>
        </label>
        <input
          id="office-email"
          type="email"
          className={`mt-1 ${input}`}
          placeholder="auslaenderbehoerde@muenchen.de"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
      </div>

      <div>
        <label className={label} htmlFor="office-phone">
          <Phone className="mr-1 inline h-3 w-3" /> Office phone (optional)
        </label>
        <input
          id="office-phone"
          type="tel"
          className={`mt-1 ${input}`}
          placeholder="+49 89 ..."
          value={value.phone ?? ''}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </div>

      <div>
        <label className={label}>
          <Calendar className="mr-1 inline h-3 w-3" /> Preferred appointment
          dates (optional, up to 3)
        </label>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="date"
              className={input}
              value={dates[i] ?? ''}
              onChange={(e) => setDate(i, e.target.value)}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          If provided, the email will politely offer these as preferences.
        </p>
      </div>
    </div>
  );
}
