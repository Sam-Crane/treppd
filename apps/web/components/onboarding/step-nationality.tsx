'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

const countries = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CD', name: 'Congo (DRC)' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SY', name: 'Syria' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
];

function countryFlag(code: string): string {
  const offset = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => c.charCodeAt(0) + offset),
  );
}

export function StepNationality() {
  const { formData, updateFormData } = useOnboardingStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const query = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query),
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          What is your nationality?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          This helps us determine which visa requirements apply to you.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="text"
          placeholder="Search for your country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border-default bg-surface p-1.5">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            No countries found
          </p>
        ) : (
          filtered.map((country) => {
            const isSelected = formData.nationality === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => updateFormData({ nationality: country.code })}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isSelected
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-text-primary hover:bg-subtle',
                )}
              >
                <span className="text-base">{countryFlag(country.code)}</span>
                <span>{country.name}</span>
                <span
                  className={cn(
                    'ml-auto text-[10px] font-mono',
                    isSelected
                      ? 'text-accent-foreground/70'
                      : 'text-text-muted',
                  )}
                >
                  {country.code}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
