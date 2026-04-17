'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  FileCheck2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Map,
  Settings,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ThemeToggle, Button } from '@/components/ui';
import { Logo } from '@/components/ui/logo';
import { ChatModalTrigger } from '@/components/chat/chat-modal';
import { HeaderUserMenu, SidebarUserMenu } from '@/components/user/user-menu';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { SkipLink } from '@/components/a11y/skip-link';

/**
 * App shell — desktop sidebar + mobile bottom nav + shared top header.
 *
 * Sidebar anatomy (top → bottom):
 *   - Logo
 *   - Workspace nav (5 items: Dashboard, Roadmap, Documents, Forms, Emails)
 *   - General nav (Settings, Help & feedback)
 *   - Upgrade teaser card
 *   - Educational disclaimer
 *   - SidebarUserMenu (avatar + name + dropdown: Profile, Settings, Logout)
 *
 * Density is intentionally tight — py-1.5 per nav row, section headings
 * use pt-3 to break up groups, the upgrade card + disclaimer fill what
 * was previously empty whitespace.
 */

const primaryNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/forms', label: 'Forms', icon: FileCheck2 },
  { href: '/appointments', label: 'Emails', icon: Mail },
] as const;

const generalNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
  // Help placeholder — future release will open a drawer with FAQ + chat
  // shortcut; for now it links to /about so the click still does something.
  { href: '/about', label: 'Help & feedback', icon: HelpCircle },
] as const;

function NavLink({
  href,
  label,
  Icon,
  isActive,
}: {
  href: string;
  label: string;
  Icon: (typeof primaryNav)[number]['icon'];
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isActive
          ? 'bg-accent-subtle text-accent-hover dark:text-accent'
          : 'text-text-secondary hover:bg-subtle hover:text-text-primary',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0',
          isActive ? 'text-accent-hover dark:text-accent' : '',
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </p>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-base text-text-primary transition-colors">
      <SkipLink />
      {/* Sidebar (desktop only) */}
      <aside
        className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col border-r border-border-default bg-surface/60 px-3 py-4 backdrop-blur-md md:flex"
        aria-label="Primary navigation"
      >
        <Link
          href="/dashboard"
          className="mb-3 flex items-center gap-2 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Logo />
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <SectionHeading>Workspace</SectionHeading>
          {primaryNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              isActive={pathname.startsWith(item.href)}
            />
          ))}

          <SectionHeading>General</SectionHeading>
          {generalNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              isActive={pathname === item.href}
            />
          ))}

          {/* Upgrade teaser fills the middle whitespace productively */}
          <div className="mt-4 rounded-xl border border-border-default bg-gradient-to-br from-accent-subtle via-surface to-surface p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3 w-3" />
              Starter plan
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Unlock unlimited AI assistance, every form guide, and priority
              alerts with Pro.
            </p>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="mt-2 w-full"
            >
              <Link href="/pricing">See plans</Link>
            </Button>
          </div>

          {/* PWA install prompt — only appears on browsers that fire
              beforeinstallprompt and when not dismissed recently */}
          <InstallPrompt className="mt-3" />
        </nav>

        <div className="mt-3 space-y-2 pt-3">
          <p className="px-2 text-[10px] leading-relaxed text-text-muted">
            Educational guidance. Not legal advice. Always verify with your
            local Ausländerbehörde.
          </p>
          <SidebarUserMenu />
        </div>
      </aside>

      {/* Right column: header + main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border-default bg-surface/80 px-4 backdrop-blur-md sm:px-6">
          <Link
            href="/dashboard"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
          >
            <Logo size="sm" />
          </Link>

          <div className="hidden flex-1 md:block" />

          <div className="flex items-center gap-1 sm:gap-2">
            <ChatModalTrigger />
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications"
            >
              <Link href="/settings">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
            <ThemeToggle />
            {/* Mobile-only user menu; desktop owns it in the sidebar. */}
            <div className="md:hidden">
              <HeaderUserMenu />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-10"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — 5 primary items */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-default bg-surface/95 backdrop-blur-md md:hidden"
        aria-label="Primary navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {primaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:bg-subtle',
                  isActive ? 'text-accent' : 'text-text-muted',
                )}
              >
                <item.icon
                  className={cn('h-5 w-5', isActive ? 'text-accent' : '')}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
