'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface UserSnapshot {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

function initials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function useSessionUser(): UserSnapshot | null {
  const [user, setUser] = useState<UserSnapshot | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const read = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setUser(null);
        return;
      }
      const meta = data.user.user_metadata ?? {};
      setUser({
        email: data.user.email ?? '',
        fullName:
          (meta.full_name as string) ??
          (meta.name as string) ??
          null,
        avatarUrl: (meta.avatar_url as string) ?? null,
      });
    };

    void read();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void read();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return user;
}

async function handleLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Hard navigation so the server also drops its session cookies
  window.location.href = '/login';
}

// ---------------------------------------------------------------- SidebarUserMenu

/**
 * Bottom-of-sidebar user dropdown. Shows avatar + name + email + chevron.
 * Opens upward (`side="top"`) so the menu doesn't clip below the viewport.
 */
export function SidebarUserMenu() {
  const user = useSessionUser();
  const router = useRouter();

  if (!user) {
    return (
      <div className="rounded-lg border border-border-default bg-subtle/40 p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-subtle" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 animate-pulse rounded bg-subtle" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-subtle/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group flex w-full items-center gap-2 rounded-lg border border-border-default bg-surface p-2 text-left transition',
          'hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        )}
      >
        <Avatar snapshot={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-text-primary">
            {user.fullName ?? user.email.split('@')[0]}
          </p>
          <p className="truncate text-[10px] text-text-muted">{user.email}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-text-muted transition group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        className="mb-2 w-56"
      >
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/profile')}>
          <UserIcon className="h-3.5 w-3.5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          <Settings className="h-3.5 w-3.5" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleLogout()}
          className="text-error focus:text-error data-[highlighted]:text-error"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------- HeaderUserMenu

/**
 * Compact header variant — avatar-only button (icon-sized) that opens the
 * same menu. Used on mobile where the sidebar isn't visible.
 */
export function HeaderUserMenu() {
  const user = useSessionUser();
  const router = useRouter();

  if (!user) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-subtle" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          'rounded-full ring-1 ring-border-default transition',
          'hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        )}
      >
        <Avatar snapshot={user} size="sm" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel>
          <span className="flex flex-col gap-0.5 normal-case tracking-normal">
            <span className="text-sm font-semibold text-text-primary">
              {user.fullName ?? user.email.split('@')[0]}
            </span>
            <span className="text-[10px] font-normal text-text-muted">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/profile')}>
          <UserIcon className="h-3.5 w-3.5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          <Settings className="h-3.5 w-3.5" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleLogout()}
          className="text-error focus:text-error data-[highlighted]:text-error"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------- Avatar

function Avatar({
  snapshot,
  size,
}: {
  snapshot: UserSnapshot;
  size: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs';
  if (snapshot.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={snapshot.avatarUrl}
        alt=""
        className={cn(dim, 'rounded-full object-cover')}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        dim,
        'flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover font-semibold text-accent-foreground',
      )}
    >
      {initials(snapshot.fullName, snapshot.email)}
    </span>
  );
}
