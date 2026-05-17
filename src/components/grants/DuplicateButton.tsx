"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";

export default function DuplicateButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/grants/${grantId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const copy = await res.json();
      router.push(`/grants/${copy.id}`);
    } catch {
      alert("Could not duplicate grant. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)", opacity: loading ? 0.6 : 1 }}>
      <Copy className="h-3 w-3" />
      {loading ? "Duplicating…" : "Duplicate"}
    </button>
  );
}
