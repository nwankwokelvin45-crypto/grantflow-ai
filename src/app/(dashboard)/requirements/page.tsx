"use client";

import { useState, useEffect, useRef } from "react";
import TopNav from "@/components/layout/TopNav";
import {
  Upload, Sparkles, Trash2, ChevronDown, ChevronUp,
  CheckCircle, Clock, FileText, Plus, X, AlertCircle,
} from "lucide-react";

interface FunderReq {
  id: string;
  funderName: string;
  rawText: string;
  fileName?: string | null;
  aiSummary?: string | null;
  keyRequirements?: string[];
  eligibilityCriteria?: string[];
  fundingPriorities?: string[];
  requiredSections?: Array<{ name: string; wordLimit?: number | null; notes?: string }>;
  importantNotes?: string[];
  analyzed: boolean;
  analyzedAt?: string | null;
  createdAt: string;
}

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<FunderReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [funderName, setFunderName] = useState("");
  const [province, setProvince] = useState("BC");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/funder-requirements")
      .then((r) => r.json())
      .then((data) => setRequirements(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleFileRead(file: File) {
    setFileName(file.name);
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      setRawText(text);
    } else {
      // For PDF/DOCX — remind user to paste the text
      setRawText("");
    }
  }

  async function handleSave() {
    setFormError("");
    if (!funderName.trim()) { setFormError("Funder name is required"); return; }
    if (rawText.trim().length < 20) { setFormError("Please paste the funder's requirements text (at least 20 characters)"); return; }

    setSaving(true);
    const res = await fetch("/api/funder-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funderName: funderName.trim(), rawText: rawText.trim(), fileName: fileName || undefined, province }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setFormError(data.error ?? "Failed to save"); return; }

    setRequirements((prev) => [data, ...prev]);
    setFunderName(""); setRawText(""); setFileName(""); setProvince("BC"); setShowForm(false);

    // Auto-analyze
    handleAnalyze(data.id);
  }

  async function handleAnalyze(id: string) {
    setAnalyzing(id);
    const res = await fetch("/api/ai/analyze-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementId: id }),
    });
    const data = await res.json();
    setAnalyzing(null);

    if (res.ok) {
      setRequirements((prev) => prev.map((r) => r.id === id ? { ...r, ...data } : r));
      setExpanded((prev) => ({ ...prev, [id]: true }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this funder requirement?")) return;
    setDeleting(id);
    await fetch(`/api/funder-requirements/${id}`, { method: "DELETE" });
    setRequirements((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  const Pill = ({ text, color }: { text: string; color: string }) => (
    <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mr-1.5 mb-1.5"
      style={{ background: color + "15", color, border: `1px solid ${color}30` }}>
      {text}
    </span>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <TopNav
        title="Funder Requirements"
        subtitle="Upload guidelines — AI tailors your grants to match"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            <Plus className="h-4 w-4" />
            Add Requirements
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* How it works banner */}
        <div className="rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4"
          style={{ background: "linear-gradient(135deg, #0D1B2A, #1A3050)" }}>
          <div className="text-4xl shrink-0">🎯</div>
          <div className="flex-1">
            <p className="font-semibold text-white mb-1">How it works</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Upload or paste a funder&apos;s guidelines PDF text. AI extracts their priorities, requirements,
              and scoring criteria. When you write a grant for that funder, the AI automatically
              tailors every section to match their specific requirements.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {["Upload", "→ AI Analyzes", "→ Auto-applied when writing"].map((s) => (
              <span key={s} className="font-medium">{s}</span>
            ))}
          </div>
        </div>

        {/* Upload form */}
        {showForm && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" style={{ color: "var(--gold)" }} />
                <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Add Funder Requirements</h2>
              </div>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Funder name + province */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                    Funder name *
                  </label>
                  <input
                    value={funderName}
                    onChange={(e) => setFunderName(e.target.value)}
                    placeholder="e.g. Vancouver Foundation, BC Arts Council"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "var(--border)", color: "var(--navy)" }}
                  />
                </div>
                <div className="w-28 shrink-0">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                    Province *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
                    <option value="BC">BC</option>
                    <option value="AB">AB</option>
                    <option value="ON">ON</option>
                    <option value="SK">SK</option>
                    <option value="MB">MB</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                  Upload guidelines (optional — TXT files auto-populate text below)
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors hover:border-gold"
                  style={{ borderColor: "var(--border)" }}>
                  <Upload className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>
                    {fileName || "Click to upload PDF, DOCX, or TXT"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    For PDF/DOCX: open the file and copy-paste the text into the box below
                  </p>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileRead(f); }} />
                </div>
              </div>

              {/* Raw text */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                  Funder requirements text * <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                    (paste from the funder&apos;s guidelines, eligibility page, or RFP)
                  </span>
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={10}
                  placeholder="Paste the funder's eligibility criteria, funding priorities, required sections, word limits, evaluation criteria, or any guidelines here…"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 resize-y"
                  style={{ borderColor: "var(--border)", color: "var(--navy)", fontFamily: "inherit" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {rawText.length} characters · More text = better AI tailoring
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-lg p-3 text-sm"
                  style={{ background: "rgba(220,38,38,0.06)", color: "#DC2626" }}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                  <Sparkles className="h-4 w-4" />
                  {saving ? "Saving & analyzing…" : "Save & Analyze with AI"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--cream)", color: "var(--text-muted)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requirements list */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3 opacity-40" />
            Loading requirements…
          </div>
        ) : requirements.length === 0 ? (
          <div className="rounded-2xl border p-14 text-center" style={{ background: "white", borderColor: "var(--border)" }}>
            <span className="text-5xl block mb-4">📋</span>
            <p className="font-serif font-bold text-xl mb-2" style={{ color: "var(--navy)" }}>
              No requirements uploaded yet
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Upload a funder&apos;s guidelines and AI will automatically tailor your grant applications to match their exact requirements.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              <Upload className="h-4 w-4" /> Upload your first requirement
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => (
              <div key={req.id} className="rounded-2xl border overflow-hidden"
                style={{ background: "white", borderColor: req.analyzed ? "var(--border)" : "rgba(196,151,74,0.3)" }}>

                {/* Card header */}
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: req.analyzed ? "rgba(46,173,107,0.1)" : "rgba(196,151,74,0.1)" }}>
                      {req.analyzed
                        ? <CheckCircle className="h-5 w-5" style={{ color: "#2EAD6B" }} />
                        : <Clock className="h-5 w-5" style={{ color: "var(--gold)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base" style={{ color: "var(--navy)" }}>
                          {req.funderName}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={req.analyzed
                            ? { background: "rgba(46,173,107,0.1)", color: "#2EAD6B" }
                            : { background: "rgba(196,151,74,0.12)", color: "var(--gold)" }}>
                          {req.analyzed ? "AI Analyzed" : "Pending Analysis"}
                        </span>
                      </div>
                      {req.fileName && (
                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <FileText className="h-3 w-3" /> {req.fileName}
                        </p>
                      )}
                      {req.aiSummary && (
                        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {req.aiSummary}
                        </p>
                      )}
                      {/* Quick pills */}
                      {req.analyzed && req.fundingPriorities && req.fundingPriorities.length > 0 && (
                        <div className="mt-2">
                          {req.fundingPriorities.slice(0, 4).map((p) => (
                            <Pill key={p} text={p} color="#4A7CC4" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!req.analyzed && (
                      <button
                        onClick={() => handleAnalyze(req.id)}
                        disabled={analyzing === req.id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                        <Sparkles className="h-3 w-3" />
                        {analyzing === req.id ? "Analyzing…" : "Analyze"}
                      </button>
                    )}
                    {req.analyzed && (
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [req.id]: !p[req.id] }))}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: "var(--cream)", color: "var(--navy)" }}>
                        {expanded[req.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expanded[req.id] ? "Less" : "Details"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(req.id)}
                      disabled={deleting === req.id}
                      className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50 disabled:opacity-40"
                      style={{ color: "var(--text-muted)" }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded analysis */}
                {expanded[req.id] && req.analyzed && (
                  <div className="px-5 pb-5 border-t pt-4 space-y-4" style={{ borderColor: "var(--border)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {req.eligibilityCriteria && req.eligibilityCriteria.length > 0 && (
                        <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: "var(--navy)" }}>
                            ✅ Eligibility Criteria
                          </p>
                          <ul className="space-y-1.5">
                            {req.eligibilityCriteria.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text)" }}>
                                <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#2EAD6B" }} />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {req.keyRequirements && req.keyRequirements.length > 0 && (
                        <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: "var(--navy)" }}>
                            📌 Key Requirements
                          </p>
                          <ul className="space-y-1.5">
                            {req.keyRequirements.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text)" }}>
                                <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--gold)" }} />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {req.requiredSections && req.requiredSections.length > 0 && (
                        <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: "var(--navy)" }}>
                            📄 Required Sections
                          </p>
                          <ul className="space-y-2">
                            {req.requiredSections.map((s, i) => (
                              <li key={i} className="text-xs" style={{ color: "var(--text)" }}>
                                <span className="font-semibold">{s.name}</span>
                                {s.wordLimit && <span style={{ color: "var(--text-muted)" }}> · max {s.wordLimit} words</span>}
                                {s.notes && <span style={{ color: "var(--text-muted)" }}> — {s.notes}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {req.importantNotes && req.importantNotes.length > 0 && (
                        <div className="rounded-xl p-4" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)" }}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: "#DC2626" }}>
                            ⚠️ Important Notes
                          </p>
                          <ul className="space-y-1.5">
                            {req.importantNotes.map((n, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text)" }}>
                                <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#DC2626" }} />
                                {n}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl p-4 flex items-center gap-3"
                      style={{ background: "rgba(46,173,107,0.06)", border: "1px solid rgba(46,173,107,0.2)" }}>
                      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#2EAD6B" }} />
                      <p className="text-sm" style={{ color: "var(--navy)" }}>
                        <span className="font-semibold">Auto-applied:</span> When you write a grant with AI and the funder name matches &ldquo;{req.funderName}&rdquo;, these requirements are automatically injected into the AI prompt.
                      </p>
                    </div>
                  </div>
                )}

                {/* Analyzing spinner */}
                {analyzing === req.id && (
                  <div className="px-5 py-4 border-t flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
                    <div className="h-4 w-4 border-2 border-navy border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--navy)" }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      AI is analyzing the funder requirements…
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
