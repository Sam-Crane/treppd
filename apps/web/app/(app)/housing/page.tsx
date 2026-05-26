'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface HousingOffice {
  id: string;
  city: string;
  name_de: string;
  address?: string;
  phone?: string;
  contact_email?: string;
  source_url?: string;
}

interface Estimate {
  eligible?: boolean | null;
  indicator?: string | null;
  threshold_eur?: number | null;
  explanation: string;
  disclaimer: string;
  next_step?: string;
}

const BUNDESLAENDER = [
  ['DE-BY', 'Bavaria'],
  ['DE-BE', 'Berlin'],
  ['DE-NW', 'North Rhine-Westphalia'],
];

export default function HousingPage() {
  const [bundesland, setBundesland] = useState('DE-NW');
  const [offices, setOffices] = useState<HousingOffice[]>([]);

  // WBS form
  const [householdSize, setHouseholdSize] = useState(1);
  const [annualIncome, setAnnualIncome] = useState('');
  const [wbs, setWbs] = useState<Estimate | null>(null);

  // Wohngeld form
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [wohngeld, setWohngeld] = useState<Estimate | null>(null);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<HousingOffice[]>(`/housing/offices?bundesland=${bundesland}`)
      .then(setOffices)
      .catch(() => setOffices([]));
  }, [bundesland]);

  async function estimateWbs() {
    setBusy(true);
    try {
      setWbs(
        await api.post<Estimate>('/housing/wbs-estimate', {
          bundesland,
          household_size: householdSize,
          annual_net_income_eur: Number(annualIncome) || 0,
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function estimateWohngeld() {
    setBusy(true);
    try {
      setWohngeld(
        await api.post<Estimate>('/housing/wohngeld-estimate', {
          bundesland,
          household_size: householdSize,
          monthly_net_income_eur: Number(monthlyIncome) || 0,
          monthly_rent_eur: Number(monthlyRent) || 0,
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Housing</h1>
        <p className="text-sm text-text-secondary">
          Check housing-benefit eligibility and find your local housing office.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <label className="text-sm text-text-secondary">State</label>
        <select
          value={bundesland}
          onChange={(e) => setBundesland(e.target.value)}
          className="rounded border border-border-default bg-base px-2 py-1.5 text-sm"
        >
          {BUNDESLAENDER.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* WBS */}
      <section className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="font-medium">WBS (Wohnberechtigungsschein) eligibility</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            Household size
            <input
              type="number"
              min={1}
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              className="mt-1 w-full rounded border border-border-default bg-base px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            Annual net income (€)
            <input
              type="number"
              min={0}
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              className="mt-1 w-full rounded border border-border-default bg-base px-2 py-1.5"
            />
          </label>
        </div>
        <button
          disabled={busy}
          onClick={estimateWbs}
          className="mt-3 rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Estimate
        </button>
        {wbs && <EstimateCard e={wbs} />}
      </section>

      {/* Wohngeld */}
      <section className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="font-medium">Wohngeld (housing benefit) indicator</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            Monthly net income (€)
            <input
              type="number"
              min={0}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="mt-1 w-full rounded border border-border-default bg-base px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            Monthly rent (€)
            <input
              type="number"
              min={0}
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="mt-1 w-full rounded border border-border-default bg-base px-2 py-1.5"
            />
          </label>
        </div>
        <button
          disabled={busy}
          onClick={estimateWohngeld}
          className="mt-3 rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Check
        </button>
        {wohngeld && <EstimateCard e={wohngeld} />}
      </section>

      {/* Offices */}
      <section className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="font-medium">Housing offices</h2>
        {offices.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            No housing offices on file for this state yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {offices.map((o) => (
              <li
                key={o.id}
                className="rounded border border-border-default p-3"
              >
                <p className="font-medium">
                  {o.name_de} — {o.city}
                </p>
                {o.address && (
                  <p className="text-text-secondary">{o.address}</p>
                )}
                {o.phone && <p className="text-text-secondary">{o.phone}</p>}
                {o.contact_email && (
                  <p className="text-text-secondary">{o.contact_email}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EstimateCard({ e }: { e: Estimate }) {
  const tone =
    e.eligible === true || e.indicator === 'likely'
      ? 'border-green-500/40 bg-green-500/10'
      : e.eligible === false || e.indicator === 'unlikely'
        ? 'border-amber-500/40 bg-amber-500/10'
        : 'border-border-default bg-base';
  return (
    <div className={`mt-3 rounded border p-3 text-sm ${tone}`}>
      <p>{e.explanation}</p>
      {e.next_step && (
        <p className="mt-1 text-text-secondary">Next: {e.next_step}</p>
      )}
      <p className="mt-2 text-xs text-text-muted">{e.disclaimer}</p>
    </div>
  );
}
