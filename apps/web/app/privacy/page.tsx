import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy — Treppd',
  description:
    'How Treppd collects, uses, and protects your data — and how to exercise your GDPR rights.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs uppercase tracking-wider text-text-muted">
        Last updated 2026-05-26
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Privacy notice</h1>
      <p className="mt-3 text-text-secondary">
        Treppd is a bureaucracy co-pilot for non-EU immigrants in Germany. This
        page explains what personal data we handle, why, how long we keep it,
        and how to exercise your rights under the GDPR. This is our privacy
        notice, not legal advice.
      </p>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">Controller</h2>
        <p className="text-sm text-text-secondary">
          Treppd (contact via <a className="underline" href="mailto:privacy@treppd.de">privacy@treppd.de</a>).
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Data we process</h2>
        <ul className="ml-5 list-disc space-y-1 text-sm text-text-secondary">
          <li>Account: email, hashed password (via Supabase Auth), preferred language.</li>
          <li>
            Immigration profile: nationality, visa type, Bundesland, city,
            goal, arrival date, visa expiry, employer/university names.
          </li>
          <li>Generated roadmap, saved form drafts, appointment watches.</li>
          <li>
            Uploaded document metadata (filename, size, type, timestamps) and
            the file bytes themselves in a private storage bucket you own.
          </li>
          <li>AI conversation history and your feedback on responses.</li>
          <li>
            Web-push subscriptions and notification preferences (only if you
            opt in).
          </li>
          <li>
            Minimal, PII-stripped audit logs of AI calls (visa type, Bundesland,
            timing) — never your name, email, or document contents.
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Purposes &amp; legal basis</h2>
        <ul className="ml-5 list-disc space-y-1 text-sm text-text-secondary">
          <li>
            Providing the service (personalised roadmap, form guidance, chat)
            — Art. 6(1)(b) GDPR (contract).
          </li>
          <li>
            Security, abuse prevention, and rate limiting — Art. 6(1)(f)
            (legitimate interest).
          </li>
          <li>
            Sensitive data (Art. 9): some profile fields may reveal your
            nationality or intended residency. We process these only with your
            explicit consent (Art. 9(2)(a)) given during onboarding and used
            solely to personalise the roadmap.
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Where your data lives</h2>
        <p className="text-sm text-text-secondary">
          Postgres and Storage are hosted on Supabase in the EU (Frankfurt).
          AI requests are sent to Anthropic (US) for the chat, roadmap
          enrichment, and form field explanation features; only the minimum
          context needed for the response is sent (never document files, never
          your name).
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Retention</h2>
        <ul className="ml-5 list-disc space-y-1 text-sm text-text-secondary">
          <li>Account and profile: until you delete your account.</li>
          <li>
            Generated roadmap: cached for 30 days, then regenerated on demand.
          </li>
          <li>
            Uploaded documents: until you delete them (individually or via the
            whole-account erasure).
          </li>
          <li>
            AI conversations: kept until account deletion; you can clear them
            from Settings.
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Your rights</h2>
        <p className="text-sm text-text-secondary">
          Under the GDPR you can:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-sm text-text-secondary">
          <li>
            <strong>Access &amp; portability (Art. 15 &amp; 20):</strong>{' '}
            Download a machine-readable JSON export of your data from{' '}
            <Link href="/settings" className="underline">
              Settings → Export my data
            </Link>
            .
          </li>
          <li>
            <strong>Rectification (Art. 16):</strong> Edit your profile from
            Settings.
          </li>
          <li>
            <strong>Erasure (Art. 17):</strong> Delete your account from
            Settings; this cascades to profile, roadmap, documents, chats,
            watches, and subscriptions.
          </li>
          <li>
            <strong>Objection &amp; withdrawal (Art. 21):</strong> Withdraw
            consent for AI processing by disabling AI features in Settings, or
            email <a className="underline" href="mailto:privacy@treppd.de">privacy@treppd.de</a>.
          </li>
          <li>
            <strong>Complaint:</strong> You may lodge a complaint with your
            local data protection authority.
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Data Protection Impact Assessment</h2>
        <p className="text-sm text-text-secondary">
          The technical assessment (Art. 35 GDPR) is published in the project
          repository at{' '}
          <a
            href="https://github.com/Sam-Crane/treppd/blob/main/docs/DPIA.md"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs/DPIA.md
          </a>
          . It documents the categories of data we process, transfers to
          third countries (Anthropic, US), risks, and mitigations.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Not legal advice</h2>
        <p className="text-sm text-text-secondary">
          Treppd provides educational guidance and is not a substitute for
          legal counsel or the responsible Ausländerbehörde. Always verify
          form names, deadlines, and requirements with the official source.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-accent underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
