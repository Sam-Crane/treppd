export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <span className="text-xl font-bold text-blue-900">TREPPD</span>
          {/* TODO: Navigation links and user menu */}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
