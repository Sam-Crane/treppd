import { Settings as SettingsIcon } from 'lucide-react';

import { NotificationToggle } from '@/components/settings/notification-toggle';
import { PageHeader } from '@/components/ui';

export const metadata = {
  title: 'Settings — Treppd',
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
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
    </div>
  );
}
