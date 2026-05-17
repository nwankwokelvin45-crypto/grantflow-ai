export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* TopNav skeleton */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="space-y-2">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-3.5 w-44 rounded" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="skeleton h-3.5 w-20 rounded mb-3" />
              <div className="skeleton h-8 w-12 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grants list skeleton */}
          <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-3.5 w-14 rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-56 rounded" />
                  <div className="skeleton h-3 w-40 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="skeleton h-3.5 w-20 rounded" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Deadlines widget skeleton */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-3.5 w-14 rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start justify-between gap-3 px-5 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
