'use client';

import { useEffect, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';

import { appointmentsApi, type SlotWatch } from '@/lib/appointments-api';

export function SlotWatches() {
  const [watches, setWatches] = useState<SlotWatch[]>([]);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setWatches(await appointmentsApi.listWatches());
    } catch {
      setWatches([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await appointmentsApi.createWatch({
        booking_url: url,
        service_label: label || undefined,
      });
      setUrl('');
      setLabel('');
      await load();
    } catch {
      setError('Could not add watch. Check the URL (must start with https://).');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await appointmentsApi.deleteWatch(id);
    await load();
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Appointment slot alerts
        </h2>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Add a booking-portal link and we&apos;ll nudge you when the page changes
        or on a weekly reminder. We can&apos;t book for you and slots may be
        inaccurate — always confirm on the official site.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://service.berlin.de/…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          onClick={add}
          disabled={busy || !url}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add watch
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {watches.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {w.service_label || w.booking_url}
              </p>
              <a
                href={w.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-blue-600 hover:underline"
              >
                {w.booking_url}
              </a>
            </div>
            <button
              onClick={() => remove(w.id)}
              aria-label="Remove watch"
              className="text-slate-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {watches.length === 0 && (
          <li className="py-2 text-sm text-slate-500">No watches yet.</li>
        )}
      </ul>

      <p className="text-[11px] text-slate-400">
        Treppd is not affiliated with any government office. Educational
        guidance, not legal advice.
      </p>
    </section>
  );
}
