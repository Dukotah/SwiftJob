export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-100 rounded-xl" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-gray-100 rounded-lg" />
          <div className="h-3 w-32 bg-gray-100 rounded-lg" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-7 w-24 bg-gray-100 rounded-lg" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
          <div className="flex items-end gap-2 h-32">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
                  <div
                    className="w-full bg-gray-100 rounded-t-lg"
                    style={{ height: `${[40, 60, 30, 80, 50, 70][i]}%` }}
                  />
                </div>
                <div className="h-2.5 w-6 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Top clients */}
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-4 bg-gray-100 rounded" />
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
