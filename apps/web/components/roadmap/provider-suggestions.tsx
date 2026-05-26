'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

import {
  providersApi,
  CATEGORY_LABELS,
  type ServiceProvider,
} from '@/lib/providers-api';

export function ProviderSuggestions({ stepSlug }: { stepSlug: string }) {
  const { data } = useQuery({
    queryKey: ['providers', stepSlug],
    queryFn: () => providersApi.forStep(stepSlug),
  });

  if (!data || data.length === 0) return null;

  // Group by category, preserving the API's category/sort_order ordering.
  const groups = new Map<string, ServiceProvider[]>();
  for (const p of data) {
    const list = groups.get(p.category) ?? [];
    list.push(p);
    groups.set(p.category, list);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Recommended services
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Independent suggestions to help you complete this step — not
        endorsements. Compare options and verify terms yourself.
      </p>

      <div className="mt-4 space-y-5">
        {Array.from(groups.entries()).map(([category, providers]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {providers.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.affiliate_url || p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-blue-400 dark:border-slate-700"
                  >
                    {/* Plain img: logos are arbitrary external/bucket URLs. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.logo_url ? (
                      <img
                        src={p.logo_url}
                        alt=""
                        className="h-8 w-8 flex-shrink-0 rounded object-contain"
                      />
                    ) : (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800">
                        {p.name.charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.name}
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                        {p.is_affiliate && (
                          <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            affiliate
                          </span>
                        )}
                      </span>
                      {p.description_en && (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {p.description_en}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
