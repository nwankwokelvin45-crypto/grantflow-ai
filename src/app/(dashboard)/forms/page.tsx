"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Users, Globe, Archive, PenLine, Trash2 } from "lucide-react";

interface Form {
  id: string;
  title: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  _count: { submissions: number; fields: number };
}

const STATUS_STYLE = {
  DRAFT:     { label: "Draft",     bg: "rgba(13,27,42,0.06)",    color: "var(--text-muted)" },
  PUBLISHED: { label: "Published", bg: "rgba(46,173,107,0.12)",  color: "#2EAD6B" },
  ARCHIVED:  { label: "Archived",  bg: "rgba(196,151,74,0.12)",  color: "var(--gold)" },
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/forms").then(r => r.json()).then(setForms).finally(() => setLoading(false));
  }, []);

  async function createForm() {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const form = await res.json();
      window.location.href = `/forms/${form.id}`;
    }
    setCreating(false);
  }

  async function deleteForm(id: string) {
    if (!confirm("Delete this form and all its submissions?")) return;
    await fetch(`/api/forms/${id}`, { method: "DELETE" });
    setForms(f => f.filter(x => x.id !== id));
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif font-bold text-2xl md:text-3xl mb-1" style={{ color: "var(--navy)" }}>Application Forms</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Build multi-step application forms for LOIs, proposals, and reports
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
          <Plus className="h-4 w-4" />
          New form
        </button>
      </div>

      {/* New form dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ background: "white", borderColor: "var(--border)" }}>
            <h2 className="font-bold text-lg mb-4" style={{ color: "var(--navy)" }}>New Form</h2>
            <input
              type="text" autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createForm()}
              placeholder="e.g. Letter of Intent – Spring 2025"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
              style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowNew(false); setNewTitle(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
              <button onClick={createForm} disabled={creating || !newTitle.trim()}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Creating..." : "Create form"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: "var(--border)" }}>
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: "var(--navy)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--navy)" }}>No forms yet</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Create your first application form</p>
          <button onClick={() => setShowNew(true)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            Create form
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => {
            const s = STATUS_STYLE[form.status];
            return (
              <div key={form.id} className="rounded-2xl border p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
                style={{ background: "white", borderColor: "var(--border)" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(196,151,74,0.1)" }}>
                  <ClipboardList className="h-5 w-5" style={{ color: "var(--gold)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--navy)" }}>{form.title}</p>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                      style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><PenLine className="h-3 w-3" />{form._count.fields} fields</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{form._count.submissions} submissions</span>
                    {form.status === "PUBLISHED" && (
                      <span className="flex items-center gap-1 font-medium" style={{ color: "#2EAD6B" }}>
                        <Globe className="h-3 w-3" />Live
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {form.status === "PUBLISHED" && (
                    <a href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      Preview
                    </a>
                  )}
                  <Link href={`/forms/${form.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                    Edit
                  </Link>
                  <button onClick={() => deleteForm(form.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {forms.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Total forms", value: forms.length },
            { label: "Published", value: forms.filter(f => f.status === "PUBLISHED").length },
            { label: "Total submissions", value: forms.reduce((a, f) => a + f._count.submissions, 0) },
          ].map(s => (
            <div key={s.label} className="rounded-xl border p-4 text-center" style={{ background: "white", borderColor: "var(--border)" }}>
              <p className="font-bold text-xl mb-0.5" style={{ color: "var(--navy)" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
