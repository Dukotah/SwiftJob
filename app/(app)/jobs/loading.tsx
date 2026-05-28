export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header skeleton */}
      <div className="h-24 bg-white border-b border-gray-100 px-4 py-4 space-y-2">
        <div className="h-5 w-32 bg-gray-100 animate-pulse rounded" />
        <div className="flex gap-2 mt-2">
          <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-full" />
          <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-full" />
          <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-11 bg-gray-100 animate-pulse rounded-xl mx-4 my-3" />

      {/* Job row skeletons */}
      <div className="space-y-2 px-4">
        <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}
