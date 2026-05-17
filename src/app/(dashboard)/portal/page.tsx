"use client";

import { useEffect, useState } from "react";
import { Globe, ClipboardList, ExternalLink, Users, Plus, Copy, Check } from "lucide-react";
import Link from "next/link";

interface PortalForm {
  id: string;
  title: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count: { submissions: number; fields: number };
}

const STATUS_STYLE = {
  RECEIVED:     { label: "Received",     color: "#4A7CC4",     bg: "rgba(74,124,196,0.1)" },
  UNDER_REVIEW: { label: "Under Review", color: "var(--gold)", bg: "rgba(196,151,74,0.1)" },
  ACCEPTED:     { label: "Accepted",     color: "#2EAD6B",     bg: "rgba(46,173,107,0.1)" },
  DECLINED:     { label: "Declined",     color: "#DC2626",     bg: "rgba(220,38,38,0.1)" },
};

export default function PortalPage() {
  const [forms, setForms] = useState<PortalForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"forms" | "lookup">("forms");

  // Applicant lookup
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResults, setLookupResults] = useState<{ id: string; formTitle: string; orgName: string; status: string; submittedAt: string; reviewNotes?: string }[]>([]);
  const [looking, setLooking] = useState(false);
  const [looked, setLooked] = useState(false);

  useEffect(() => {
    fetch("/api/forms")
      .then(r => r.json())
      .then(data => setForms(Array.isArray(data) ? data.filter((f: PortalForm) => f.status === "PUBLISHED") : []))
      .finally(() => setLoading(false));
  }, []);

  function copyLink(formId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/f/${formId}`);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function lookupSubmissions() {
    if (!lookupEmail.trim()) return;
    setLooking(true);
    const res = await fetch(`/api/portal/submissions?email=${encodeURIComponent(lookupEmail.trim().toLowerCase())}`);
    if (res.ok) setLookupResults(await res.json());
    setLooking(false);
    setLooked(true);
  }

  const totalSubmissions = forms.reduce((s, f) => s + f._count.submissions, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl md:text-3xl mb-1" style={{ color: "var(--navy)" }}>
          Applicant Portal
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Secure self-service portal for applicants to submit, track status, and receive updates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Live forms", value: forms.length, icon: ClipboardList, color: "var(--gold)" },
          { label: "Total submissions", value: totalSubmissions, icon: Users, color: "#4A7CC4" },
          { label: "Portal URL", value: "Active", icon: Globe, color: "#2EAD6B" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border p-4" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: s.color }} />
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
              <p className="font-bold text-xl" style={{ color: "var(--navy)" }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {(["forms", "lookup"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={{
              borderBottomColor: tab === t ? "var(--gold)" : "transparent",
              color: tab === t ? "var(--navy)" : "var(--text-muted)",
            }}>
            {t === "forms" ? "Published Forms" : "Applicant Lookup"}
          </button>
        ))}
      </div>

      {/* Published forms tab */}
      {tab === "forms" && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />)}
            </div>
          ) : forms.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: "var(--border)" }}>
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: "var(--navy)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--navy)" }}>No published forms</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                Publish a form to make it available to applicants
              </p>
              <Link href="/forms"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                <Plus className="h-4 w-4" /> Go to Forms
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map(form => (
                <div key={form.id} className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{form.title}</p>
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: "rgba(46,173,107,0.1)", color: "#2EAD6B" }}>Live</span>
                      </div>
                      {form.description && (
                        <p className="text-xs mb-2 line-clamp-1" style={{ color: "var(--text-muted)" }}>{form.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{form._count.fields} fields</span>
                        <span>{form._count.submissions} submissions</span>
                      </div>

                      {/* Shareable link */}
                      <div className="flex items-center gap-2 mt-3">
                        <code className="flex-1 text-xs rounded-lg px-3 py-1.5 truncate"
                          style={{ background: "var(--cream)", color: "var(--text-muted)" }}>
                          {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/f/{form.id}
                        </code>
                        <button onClick={() => copyLink(form.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all"
                          style={{ borderColor: "var(--border)", color: "var(--navy)", background: "white" }}>
                          {copiedId === form.id ? <><Check className="h-3 w-3 inline mr-1" />Copied</> : <><Copy className="h-3 w-3 inline mr-1" />Copy</>}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <a href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                        <ExternalLink className="h-3 w-3" /> Preview
                      </a>
                      <Link href={`/forms/${form.id}`}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applicant lookup tab */}
      {tab === "lookup" && (
        <div className="max-w-lg">
          <div className="rounded-2xl border p-6 mb-6" style={{ background: "white", borderColor: "var(--border)" }}>
            <h2 className="font-bold text-base mb-1" style={{ color: "var(--navy)" }}>Look up applicant submissions</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Enter an applicant's email address to view all their submissions and current status
            </p>
            <div className="flex gap-2">
              <input type="email" value={lookupEmail} onChange={e => setLookupEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupSubmissions()}
                placeholder="applicant@organization.org"
                className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
              <button onClick={lookupSubmissions} disabled={looking || !lookupEmail.trim()}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: looking ? 0.7 : 1 }}>
                {looking ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {looked && (
            lookupResults.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                No submissions found for <strong>{lookupEmail}</strong>
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  {lookupResults.length} submission{lookupResults.length !== 1 ? "s" : ""} for {lookupEmail}
                </p>
                {lookupResults.map(sub => {
                  const s = STATUS_STYLE[sub.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.RECEIVED;
                  return (
                    <div key={sub.id} className="rounded-xl border p-4" style={{ background: "white", borderColor: "var(--border)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{sub.formTitle}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub.orgName}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            Submitted {new Date(sub.submittedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          {sub.reviewNotes && (
                            <p className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
                              Note: {sub.reviewNotes}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold shrink-0"
                          style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
