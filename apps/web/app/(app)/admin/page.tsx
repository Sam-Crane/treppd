'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const RESOURCES = [
  { slug: 'offices', label: 'Offices' },
  { slug: 'housing-offices', label: 'Housing offices' },
  { slug: 'housing-parameters', label: 'Housing parameters' },
  { slug: 'requirement-tags', label: 'Requirement tags' },
  { slug: 'roadmap-steps', label: 'Roadmap steps' },
  { slug: 'document-requirements', label: 'Document requirements' },
  { slug: 'forms', label: 'Forms' },
] as const;

type Row = Record<string, unknown>;

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

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [resource, setResource] = useState<string>(RESOURCES[0].slug);
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<string>('{\n  \n}');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ingest, setIngest] = useState<IngestResponse | null>(null);

  useEffect(() => {
    api
      .get<{ isAdmin: boolean }>('/admin/whoami')
      .then((r) => setAllowed(r.isAdmin))
      .catch(() => setAllowed(false));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await api.get<Row[]>(`/admin/content/${resource}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [resource]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const row = JSON.parse(draft) as Row;
      await api.post(`/admin/content/${resource}`, { row });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    setError(null);
    try {
      await api.delete(`/admin/content/${resource}/${encodeURIComponent(id)}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function runIngest(dryRun: boolean) {
    setBusy(true);
    setError(null);
    setIngest(null);
    try {
      setIngest(await api.post<IngestResponse>('/admin/ingest', { dryRun }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (allowed === null) {
    return <p className="text-text-secondary">Checking access…</p>;
  }
  if (!allowed) {
    return (
      <div className="rounded-lg border border-border-default bg-surface p-6">
        <h1 className="text-lg font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Your account does not have an admin role.
        </p>
      </div>
    );
  }

  const idKey =
    resource === 'roadmap-steps'
      ? 'slug'
      : resource === 'forms'
        ? 'form_code'
        : resource === 'requirement-tags'
          ? 'tag'
          : resource === 'housing-parameters'
            ? 'key'
            : 'id';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Content admin</h1>
        <p className="text-sm text-text-secondary">
          Edit verified content and re-run RAG ingestion. Writes re-stamp
          verified_at.
        </p>
      </header>

      {/* Ingestion */}
      <section className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="font-medium">Knowledge ingestion</h2>
        <div className="mt-2 flex gap-2">
          <button
            disabled={busy}
            onClick={() => runIngest(true)}
            className="rounded border border-border-default px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Dry run
          </button>
          <button
            disabled={busy}
            onClick={() => runIngest(false)}
            className="rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Run ingestion
          </button>
        </div>
        {ingest && (
          <div className="mt-3 text-sm">
            <p className="text-text-secondary">
              {ingest.dry_run ? 'Dry run — ' : ''}
              {ingest.ingested_sources} sources, {ingest.total_chunks} chunks
            </p>
            <ul className="mt-1 max-h-48 overflow-auto">
              {ingest.results.map((r) => (
                <li
                  key={r.url}
                  className={r.ok ? 'text-text-secondary' : 'text-red-500'}
                >
                  {r.ok ? '✓' : '✗'} {r.url} ({r.chunks})
                  {r.error ? ` — ${r.error}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Resource picker */}
      <div className="flex flex-wrap gap-2">
        {RESOURCES.map((r) => (
          <button
            key={r.slug}
            onClick={() => {
              setResource(r.slug);
              setIngest(null);
            }}
            className={`rounded px-3 py-1.5 text-sm ${
              resource === r.slug
                ? 'bg-accent text-white'
                : 'border border-border-default'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {/* Editor */}
      <section className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="font-medium">Add / update row (JSON)</h2>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          className="mt-2 w-full rounded border border-border-default bg-base p-2 font-mono text-xs"
        />
        <button
          disabled={busy}
          onClick={save}
          className="mt-2 rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Upsert
        </button>
      </section>

      {/* Table */}
      <section className="overflow-auto rounded-lg border border-border-default">
        <table className="w-full text-left text-xs">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border-default align-top">
                <td className="p-2">
                  <button
                    onClick={() => remove(String(row[idKey]))}
                    className="text-red-500 hover:underline"
                  >
                    delete
                  </button>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => setDraft(JSON.stringify(row, null, 2))}
                    className="text-accent hover:underline"
                  >
                    edit
                  </button>
                </td>
                <td className="p-2 font-mono">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(row)}
                  </pre>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-text-secondary">No rows.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
