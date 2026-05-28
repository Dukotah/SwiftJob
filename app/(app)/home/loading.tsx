export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header skeleton */}
      <div className="h-20 bg-white border-b border-gray-100" />

      <div className="px-4 py-4 space-y-3">
        {/* Earnings hero card skeleton */}
        <div className="h-40 bg-blue-200 animate-pulse rounded-3xl" />

        {/* Quick stats strip skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-16 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="flex-1 h-16 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="flex-1 h-16 bg-gray-100 animate-pulse rounded-2xl" />
        </div>

        {/* Quick actions grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
        </div>

        {/* Section label skeleton */}
        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />

        {/* Activity feed skeleton */}
        <div className="space-y-2">
          <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
          <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
          <div className="h-16 bg-white border border-gray-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
