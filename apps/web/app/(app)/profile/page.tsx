'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, Plane, UserCircle2 } from 'lucide-react';

import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Skeleton,
} from '@/components/ui';

interface UserProfile {
  user_id: string;
  visa_type: string | null;
  bundesland: string | null;
  city: string | null;
  goal: string | null;
  nationality: string | null;
  arrival_date: string | null;
  visa_expiry_date: string | null;
  employer_name: string | null;
  university_name: string | null;
}

interface AuthSnapshot {
  email: string;
  fullName: string | null;
  createdAt: string | null;
}

const BUNDESLAND_NAMES: Record<string, string> = {
  'DE-BW': 'Baden-Württemberg',
  'DE-BY': 'Bavaria',
  'DE-BE': 'Berlin',
  'DE-BB': 'Brandenburg',
  'DE-HB': 'Bremen',
  'DE-HH': 'Hamburg',
  'DE-HE': 'Hesse',
  'DE-MV': 'Mecklenburg-Vorpommern',
  'DE-NI': 'Lower Saxony',
  'DE-NW': 'North Rhine-Westphalia',
  'DE-RP': 'Rhineland-Palatinate',
  'DE-SL': 'Saarland',
  'DE-SN': 'Saxony',
  'DE-ST': 'Saxony-Anhalt',
  'DE-SH': 'Schleswig-Holstein',
  'DE-TH': 'Thuringia',
};

function useAuthUser(): AuthSnapshot | null {
  const [snapshot, setSnapshot] = useState<AuthSnapshot | null>(null);
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const meta = data.user.user_metadata ?? {};
      setSnapshot({
        email: data.user.email ?? '',
        fullName:
          (meta.full_name as string) ?? (meta.name as string) ?? null,
        createdAt: data.user.created_at ?? null,
      });
    })();
  }, []);
  return snapshot;
}

function DetailRow({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | null | undefined;
  Icon?: typeof Mail;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="flex items-center gap-2 text-xs font-medium text-text-secondary">
        {Icon && <Icon className="h-3.5 w-3.5 text-text-muted" />}
        {label}
      </span>
      <span className="text-right text-sm text-text-primary">
        {value && value.trim().length > 0 ? (
          value
        ) : (
          <span className="text-text-muted">Not set</span>
        )}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthUser();
  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles/me'),
    retry: false,
  });

  const profile = profileQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<UserCircle2 className="h-6 w-6" />}
        title="Your profile"
        description="The details behind your personalised roadmap + form guides."
      />

      {/* Identity card */}
      <Card padding="lg">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-lg font-semibold text-accent-foreground">
            {user
              ? (user.fullName ?? user.email).slice(0, 2).toUpperCase()
              : '…'}
          </div>
          <div className="min-w-0 flex-1">
            {user ? (
              <>
                <p className="text-lg font-semibold text-text-primary">
                  {user.fullName ?? user.email.split('@')[0]}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-text-muted">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
              </>
            ) : (
              <>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1 h-3 w-60" />
              </>
            )}
          </div>
          <Badge variant="info">Starter plan</Badge>
        </div>
      </Card>

      {/* Immigration profile */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Immigration profile</CardTitle>
          <CardDescription>
            This is what Treppd uses to build your roadmap and filter which
            form guides apply. Edit from Settings (coming soon).
          </CardDescription>
        </CardHeader>

        {profileQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : profileQuery.isError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-error dark:bg-red-950/40">
            Couldn&apos;t load your profile.{' '}
            {profileQuery.error instanceof Error
              ? profileQuery.error.message
              : 'Please try again.'}
          </p>
        ) : (
          <div className="divide-y divide-border-default">
            <DetailRow
              label="Nationality"
              value={profile?.nationality}
              Icon={Plane}
            />
            <DetailRow
              label="Visa type"
              value={profile?.visa_type}
            />
            <DetailRow
              label="Bundesland"
              value={
                profile?.bundesland
                  ? `${BUNDESLAND_NAMES[profile.bundesland] ?? profile.bundesland} (${profile.bundesland})`
                  : null
              }
              Icon={MapPin}
            />
            <DetailRow label="City" value={profile?.city} />
            <DetailRow label="Goal" value={profile?.goal} />
            <DetailRow
              label="Arrival date"
              value={profile?.arrival_date ?? null}
            />
            <DetailRow
              label="Visa expiry"
              value={profile?.visa_expiry_date ?? null}
            />
            {profile?.employer_name && (
              <DetailRow label="Employer" value={profile.employer_name} />
            )}
            {profile?.university_name && (
              <DetailRow label="University" value={profile.university_name} />
            )}
          </div>
        )}
      </Card>

      {/* Account metadata */}
      {user?.createdAt && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <DetailRow
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </Card>
      )}
    </div>
  );
}
