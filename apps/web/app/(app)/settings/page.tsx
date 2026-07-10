import Link from 'next/link';
import { Settings as SettingsIcon } from 'lucide-react';

import { NotificationToggle } from '@/components/settings/notification-toggle';
import { DeleteAccountButton } from '@/components/settings/delete-account-button';
import { PageHeader } from '@/components/ui';

export const metadata = {
  title: 'Settings — Treppd',
};

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        icon={<SettingsIcon className="h-6 w-6" />}
        title="Settings"
        description="Control your alerts, privacy, and account data."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">
          Notifications
        </h2>
        <NotificationToggle />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">
          Privacy &amp; data
        </h2>
        <p className="text-sm text-text-secondary">
          Read the{' '}
          <Link href="/privacy" className="underline">
            privacy notice
          </Link>{' '}
          for what we store and why. You can download a machine-readable JSON
          copy of your data from the sidebar (&quot;Export my data&quot;).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
          Danger zone
        </h2>
        <p className="text-sm text-text-secondary">
          Deleting your account is immediate and permanent. Everything we hold
          about you — profile, roadmap, uploaded documents, chat history, form
          drafts, appointment watches, notification subscriptions, and
          AI-generation audit rows — is erased in a single cascade.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
