export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-9 w-64 bg-gray-200 rounded-lg" />
        <div className="mt-2 h-5 w-96 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
      </div>
    </div>
  );
}
