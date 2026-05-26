'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, LogOut } from 'lucide-react';

import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/offices', label: 'Offices' },
  { href: '/admin/housing-offices', label: 'Housing offices' },
  { href: '/admin/housing-parameters', label: 'Housing parameters' },
  { href: '/admin/service-providers', label: 'Providers' },
  { href: '/admin/roadmap-steps', label: 'Roadmap steps' },
  { href: '/admin/document-requirements', label: 'Document requirements' },
  { href: '/admin/requirement-tags', label: 'Requirement tags' },
  { href: '/admin/forms', label: 'Forms' },
  { href: '/admin/ingestion', label: 'Ingestion' },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok' | 'denied'>('checking');

  // Secondary guard. Middleware already blocks non-admins via the JWT claim;
  // this catches the edge case of a stale claim and keeps the boundary honest.
  useEffect(() => {
    api
      .get<{ isAdmin: boolean }>('/admin/whoami')
      .then((r) => setState(r.isAdmin ? 'ok' : 'denied'))
      .catch(() => setState('denied'));
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-secondary">
        Checking admin access…
      </div>
    );
  }
  if (state === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-border-default bg-surface p-6 text-center">
          <h1 className="text-lg font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your account does not have an admin role.
          </p>
          <Link href="/login" className="mt-3 inline-block text-sm text-accent">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-base text-text-primary">
      <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col border-r border-border-default bg-surface/60 px-3 py-4 md:flex">
        <div className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-accent" />
          Treppd Admin
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-subtle text-accent-hover dark:text-accent'
                    : 'text-text-secondary hover:bg-subtle hover:text-text-primary',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary hover:bg-subtle"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-default bg-surface/80 px-4 backdrop-blur-md sm:px-6">
          <span className="text-sm font-medium text-text-secondary">
            Admin portal
          </span>
          <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">
            Staff
          </span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
