'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface IngestSourceResult {
  url: string;
  chunks: number;
  ok: boolean;
  error?: string;
}
interface IngestResponse {
  dry_run: boolean;
  ingested_sources: number;
  total_chunks: number;
  results: IngestSourceResult[];
}

export default function IngestionPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  async function run(dryRun: boolean) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.post<IngestResponse>('/admin/ingest', { dryRun }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Knowledge ingestion</h1>
        <p className="text-sm text-text-secondary">
          Fetch, chunk, embed and store the curated RAG sources. A full run can
          take a few minutes.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => run(true)}
          className="rounded border border-border-default px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Dry run
        </button>
        <button
          disabled={busy}
          onClick={() => run(false)}
          className="rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? 'Running…' : 'Run ingestion'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="rounded-lg border border-border-default bg-surface p-4 text-sm">
          <p className="text-text-secondary">
            {result.dry_run ? 'Dry run — ' : ''}
            {result.ingested_sources} sources, {result.total_chunks} chunks
          </p>
          <ul className="mt-2 max-h-72 overflow-auto">
            {result.results.map((r) => (
              <li
                key={r.url}
                className={r.ok ? 'text-text-secondary' : 'text-red-500'}
              >
                {r.ok ? '✓' : '✗'} {r.url} ({r.chunks}){r.error ? ` — ${r.error}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
