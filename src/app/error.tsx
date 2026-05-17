"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--cream)" }}>
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "var(--navy)" }}>Something went wrong</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          An unexpected error occurred. Try refreshing the page or going back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            Try again
          </button>
          <a href="/dashboard"
            className="rounded-lg border px-6 py-2.5 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
