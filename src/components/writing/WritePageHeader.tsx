"use client";

import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface Props {
  grantId: string;
  grantTitle: string;
  funderName: string;
  orgName: string;
}

export default function WritePageHeader({ grantId, grantTitle, funderName, orgName }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "pdf" | "docx" | "txt") {
    setExporting(true);
    try {
      const res = await fetch(`/api/grants/${grantId}/export?format=${format}`);
      if (!res.ok) {
        alert("Export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${grantTitle.replace(/[^a-z0-9]/gi, "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b px-3 md:px-6 py-2.5 shrink-0 gap-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <Link href={`/grants/${grantId}`}
          className="flex items-center gap-1 text-sm font-medium shrink-0 transition-colors"
          style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm truncate" style={{ color: "var(--navy)" }}>{grantTitle}</h1>
          <p className="text-xs truncate hidden sm:block" style={{ color: "var(--text-muted)" }}>
            {funderName} · {orgName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* On mobile show only PDF; show all on desktop */}
        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", color: "white" }}>
          <Download className="h-3 w-3" />
          {exporting ? "…" : "PDF"}
        </button>
        {(["docx", "txt"] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => handleExport(fmt)}
            disabled={exporting}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface)" }}>
            <Download className="h-3 w-3" />
            {exporting ? "…" : fmt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
