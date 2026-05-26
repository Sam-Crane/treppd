import Link from 'next/link';

const SECTIONS = [
  ['/admin/offices', 'Offices', 'Immigration & registration offices'],
  ['/admin/housing-offices', 'Housing offices', 'Wohnungsamt / Wohngeldstelle'],
  ['/admin/housing-parameters', 'Housing parameters', 'WBS / Wohngeld figures'],
  ['/admin/service-providers', 'Providers', 'Insurance, banks, housing, jobs'],
  ['/admin/roadmap-steps', 'Roadmap steps', 'Verified bureaucratic steps'],
  ['/admin/document-requirements', 'Document requirements', 'Per-step documents'],
  ['/admin/requirement-tags', 'Requirement tags', 'Canonical document types'],
  ['/admin/forms', 'Forms', 'Official forms + field guidance'],
  ['/admin/ingestion', 'Ingestion', 'Run the RAG knowledge pipeline'],
] as const;

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Content admin</h1>
        <p className="text-sm text-text-secondary">
          Manage verified content and run knowledge ingestion.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(([href, label, desc]) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-border-default bg-surface p-4 transition-colors hover:border-accent"
          >
            <p className="font-medium">{label}</p>
            <p className="mt-1 text-sm text-text-secondary">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
