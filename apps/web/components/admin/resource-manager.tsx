'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Row = Record<string, unknown>;

/**
 * Generic admin CRUD surface for a whitelisted content resource. Talks to the
 * NestJS /admin/content/:resource endpoints (guarded by AdminGuard). `idKey` is
 * the resource's natural key, used for delete + edit prefill.
 */
export function ResourceManager({
  resource,
  idKey,
  title,
}: {
  resource: string;
  idKey: string;
  title: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState('{\n  \n}');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await api.get<Row[]>(`/admin/content/${resource}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [resource]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError(null);
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

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-text-secondary">
          {rows.length} record{rows.length === 1 ? '' : 's'}. Writes re-stamp
          verified_at where applicable.
        </p>
      </header>

      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="font-medium">Add / update (JSON)</h2>
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
                  <pre className="whitespace-pre-wrap">{JSON.stringify(row)}</pre>
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
