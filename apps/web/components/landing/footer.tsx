import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

const LINKS = [
  {
    heading: 'Product',
    items: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/register', label: 'Get started' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { href: '/about', label: 'About' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
  {
    heading: 'Sources we cite',
    items: [
      { href: 'https://www.bamf.de', label: 'BAMF' },
      { href: 'https://www.make-it-in-germany.com', label: 'Make-it-in-Germany' },
      { href: 'https://www.daad.de', label: 'DAAD' },
      { href: 'https://handbookgermany.de', label: 'HandbookGermany' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-surface py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex">
                <Logo />
            </Link>
            <p className="mt-3 max-w-xs text-xs text-text-muted">
              Educational guidance for non-EU immigrants in Germany. Not legal
              advice — always verify with your local Ausländerbehörde or a
              qualified Rechtsanwalt.
            </p>
          </div>

          {LINKS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {section.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border-default pt-6 text-xs text-text-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Treppd. Made with care in Deggendorf.</p>
          <p>Data hosted in the EU (Supabase Frankfurt).</p>
        </div>
      </div>
    </footer>
  );
}
