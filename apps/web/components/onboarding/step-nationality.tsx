'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';

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
        <h2 className="text-xl font-semibold text-gray-900">
          What is your nationality?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          This helps us determine which visa requirements apply to you.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for your country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
        />
      </div>

      <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#1a365d] font-medium text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{countryFlag(country.code)}</span>
                <span>{country.name}</span>
                <span
                  className={`ml-auto text-xs ${
                    isSelected ? 'text-blue-200' : 'text-gray-400'
                  }`}
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

function countryFlag(code: string): string {
  const offset = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => c.charCodeAt(0) + offset),
  );
}
