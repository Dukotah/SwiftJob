export default function ClientsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header skeleton */}
      <div className="h-24 bg-white border-b border-gray-100" />

      {/* Client card skeletons */}
      <div className="space-y-2 px-4 pt-3">
        <div className="h-24 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-24 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-24 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-24 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-24 bg-white border border-gray-100 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}
