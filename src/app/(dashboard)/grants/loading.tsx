export default function GrantsLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="space-y-2">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-3.5 w-52 rounded" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border p-5 space-y-3" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-1.5 w-full rounded-full" />
              <div className="flex items-center justify-between">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
