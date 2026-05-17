"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  grantId: string;
  grantTitle: string;
  redirectAfter?: string; // e.g. "/grants" — if omitted, stays on page (list will refresh)
  onDeleted?: () => void;
  variant?: "icon" | "button";
}

export default function DeleteGrantButton({ grantId, grantTitle, redirectAfter, onDeleted, variant = "icon" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${grantTitle}"?\n\nThis will permanently remove the grant and all its sections. This cannot be undone.`)) return;

    setLoading(true);
    const res = await fetch(`/api/grants/${grantId}`, { method: "DELETE" });
    if (res.ok) {
      if (redirectAfter) {
        router.push(redirectAfter);
        router.refresh();
      } else {
        onDeleted?.();
        router.refresh();
      }
    } else {
      alert("Failed to delete grant. Please try again.");
      setLoading(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:bg-red-50 hover:border-red-200"
        style={{ borderColor: "var(--border)", color: loading ? "var(--text-muted)" : "#DC2626", opacity: loading ? 0.6 : 1 }}>
        <Trash2 className="h-3 w-3" />
        {loading ? "Deleting…" : "Delete"}
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Delete grant"
      className="rounded-lg p-1.5 transition-all hover:bg-red-50"
      style={{ color: loading ? "var(--text-muted)" : "var(--text-muted)", opacity: loading ? 0.5 : 1 }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
