'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bell, BellRing, Check, Loader2 } from 'lucide-react';

import {
  getSubscription,
  isPushSupported,
  notificationsApi,
  type NotificationPreferences,
} from '@/lib/notifications-api';

type Status =
  | 'idle'
  | 'subscribing'
  | 'subscribed'
  | 'unsubscribing'
  | 'denied'
  | 'unsupported'
  | 'error';

const DEFAULT_PREFS: Omit<NotificationPreferences, 'user_id'> = {
  visa_expiry_enabled: true,
  anmeldung_enabled: true,
  roadmap_nudges_enabled: true,
  digest_hour: 9,
  timezone: 'Europe/Berlin',
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={[
          'relative h-5 w-9 flex-shrink-0 rounded-full transition',
          checked
            ? 'bg-blue-600 dark:bg-blue-500'
            : 'bg-slate-300 dark:bg-slate-700',
          disabled ? 'cursor-not-allowed opacity-50' : '',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
            checked ? 'left-4' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  );
}

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent'>(
    'idle',
  );

  // Detect support + existing subscription state on mount.
  useEffect(() => {
    (async () => {
      if (!isPushSupported()) {
        setStatus('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setStatus('denied');
      }
      const sub = await getSubscription();
      if (sub) {
        setStatus('subscribed');
      }
      try {
        const p = await notificationsApi.getPreferences();
        setPrefs(p);
      } catch {
        /* leave prefs null; toggle rows disabled */
      }
    })();
  }, []);

  async function handleEnable() {
    setError(null);
    setStatus('subscribing');
    try {
      await notificationsApi.subscribe();
      setStatus('subscribed');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not enable notifications.';
      if (msg.includes('denied')) {
        setStatus('denied');
      } else if (msg.includes('not supported')) {
        setStatus('unsupported');
      } else {
        setStatus('error');
      }
      setError(msg);
    }
  }

  async function handleDisable() {
    setStatus('unsubscribing');
    try {
      await notificationsApi.unsubscribe();
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disable notifications.');
      setStatus('subscribed');
    }
  }

  async function updatePref(
    key: keyof Omit<NotificationPreferences, 'user_id' | 'timezone' | 'digest_hour'>,
    value: boolean,
  ) {
    if (!prefs) return;
    setSavingPrefs(true);
    setPrefs({ ...prefs, [key]: value });
    try {
      const next = await notificationsApi.updatePreferences({ [key]: value });
      setPrefs(next);
    } catch {
      // Revert on failure
      setPrefs(prefs);
      setError('Could not save preference. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleSendTest() {
    setTestStatus('sending');
    try {
      await notificationsApi.sendTestPush();
      setTestStatus('sent');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch {
      setTestStatus('idle');
      setError('Test push failed.');
    }
  }

  if (status === 'unsupported') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertCircle className="mr-1 inline h-4 w-4" />
        Push notifications aren\u2019t supported in this browser. On Safari, add
        Treppd to your Home Screen and open from there (Safari 16.4 or later).
      </div>
    );
  }

  const active = status === 'subscribed';
  const busy =
    status === 'subscribing' || status === 'unsubscribing' || savingPrefs;

  const enabledForAll = prefs ?? { user_id: '', ...DEFAULT_PREFS };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {active ? (
            <BellRing className="h-5 w-5 text-blue-500" />
          ) : (
            <Bell className="h-5 w-5 text-slate-400" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Deadline alerts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {active
                ? 'You\u2019ll get push notifications for visa + Anmeldung deadlines.'
                : 'Turn on push notifications to get reminders about visa renewal and Anmeldung deadlines.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={active ? handleDisable : handleEnable}
          disabled={busy || status === 'denied'}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition',
            active
              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              : 'bg-blue-600 text-white hover:bg-blue-700',
            busy ? 'opacity-60' : '',
          ].join(' ')}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : active ? (
            'Turn off'
          ) : (
            'Turn on'
          )}
        </button>
      </header>

      {status === 'denied' && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Notifications are blocked in your browser settings. Open site settings
          to re-enable them, then come back and click Turn on.
        </p>
      )}

      {error && status !== 'denied' && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {active && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="mt-3 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800"
        >
          <ToggleRow
            label="Visa expiry reminders"
            description="At 90, 30, and 7 days before your residence permit expires."
            checked={enabledForAll.visa_expiry_enabled}
            onChange={(v) => updatePref('visa_expiry_enabled', v)}
            disabled={!prefs || savingPrefs}
          />
          <ToggleRow
            label="Anmeldung 14-day deadline"
            description="A nudge 4 days before the statutory registration deadline."
            checked={enabledForAll.anmeldung_enabled}
            onChange={(v) => updatePref('anmeldung_enabled', v)}
            disabled={!prefs || savingPrefs}
          />
          <ToggleRow
            label="Roadmap nudges"
            description="Gentle reminders on steps blocked by a missing document or appointment."
            checked={enabledForAll.roadmap_nudges_enabled}
            onChange={(v) => updatePref('roadmap_nudges_enabled', v)}
            disabled={!prefs || savingPrefs}
          />

          <div className="flex items-center justify-between pt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Want to check it\u2019s working?
            </p>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testStatus === 'sending'}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {testStatus === 'sending' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sending
                </>
              ) : testStatus === 'sent' ? (
                <>
                  <Check className="h-3 w-3" />
                  Sent
                </>
              ) : (
                'Send test push'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
