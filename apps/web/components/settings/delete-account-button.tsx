'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

/**
 * GDPR Art. 17 erasure. Two-step confirm (typed "delete"), then:
 *   1. DELETE /profiles/me — server calls Supabase admin.deleteUser, which
 *      cascades to every user-scoped table.
 *   2. Sign out client-side so the session cookie clears immediately.
 *   3. Redirect to the landing page.
 */
export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (phrase.trim().toLowerCase() !== 'delete') return;
    setBusy(true);
    setError(null);
    try {
      await api.delete('/profiles/me');
      await createClient().auth.signOut();
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError((e as Error).message || 'Could not delete account.');
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
      >
        <AlertTriangle className="h-4 w-4" />
        Delete my account
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
      <p className="text-sm text-red-800 dark:text-red-200">
        This permanently removes your account, profile, uploaded documents,
        chat history, form drafts, appointment watches, and notification
        subscriptions. This cannot be undone.
      </p>
      <label className="block text-xs text-red-800 dark:text-red-200">
        Type <span className="font-mono font-semibold">delete</span> to
        confirm:
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          className="mt-1 w-full rounded border border-red-300 bg-white px-2 py-1 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100"
          disabled={busy}
          autoFocus
        />
      </label>
      {error && <p className="text-xs text-red-700 dark:text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy || phrase.trim().toLowerCase() !== 'delete'}
          className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Deleting…' : 'Permanently delete'}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setPhrase('');
            setError(null);
          }}
          disabled={busy}
          className="rounded border border-border-default bg-surface px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
