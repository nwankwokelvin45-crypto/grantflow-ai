"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, AlertTriangle, ExternalLink,
  Download, ClipboardCheck, Send, Bell, ChevronRight, X, Pencil,
} from "lucide-react";

interface Section { label: string; isComplete: boolean; isRequired: boolean }

interface Props {
  grantId: string;
  grantTitle: string;
  status: string;
  deadline: string | null;
  complianceScore: number | null;
  sections: Section[];
  funderName: string;
  funderWebsite: string | null;
  // existing submission data
  submittedAt: string | null;
  submissionPortal: string | null;
  submissionMethod: string | null;
  submissionReference: string | null;
  submissionNotes: string | null;
  followUpDate: string | null;
}

type Step = "checklist" | "record";

const METHOD_OPTIONS = ["Online Portal", "Email", "Mail / Post", "In Person"];

function CheckItem({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "var(--warm-gray)" }}>
      {ok ? (
        <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "#2EAD6B" }} />
      ) : warn ? (
        <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#F59E0B" }} />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" style={{ color: "#DC2626" }} />
      )}
      <span className="text-sm" style={{ color: ok ? "var(--navy)" : warn ? "#92400E" : "#DC2626" }}>
        {label}
      </span>
    </div>
  );
}

export default function SubmitSection({
  grantId, grantTitle, status, deadline, complianceScore, sections,
  funderName, funderWebsite,
  submittedAt, submissionPortal, submissionMethod, submissionReference, submissionNotes, followUpDate,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<Step>("checklist");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const today = new Date().toISOString().split("T")[0];
  const defaultFollowUp = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    submittedAt: submittedAt ? submittedAt.split("T")[0] : today,
    submissionMethod: submissionMethod ?? "Online Portal",
    submissionPortal: submissionPortal ?? funderWebsite ?? "",
    submissionReference: submissionReference ?? "",
    submissionNotes: submissionNotes ?? "",
    followUpDate: followUpDate ? followUpDate.split("T")[0] : defaultFollowUp,
  });

  // Checklist calculations
  const requiredSections = sections.filter((s) => s.isRequired);
  const completedRequired = requiredSections.filter((s) => s.isComplete).length;
  const allRequiredDone = completedRequired === requiredSections.length;
  const scoreOk = complianceScore != null && complianceScore >= 70;
  const scoreWarn = complianceScore != null && complianceScore >= 50 && complianceScore < 70;
  const deadlineOk = !deadline || new Date(deadline) > new Date();
  const daysLeft = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000) : null;
  const readyToSubmit = allRequiredDone && deadlineOk;

  async function handleSave(isNew: boolean) {
    setSaving(true);
    setError("");
    try {
      const endpoint = `/api/grants/${grantId}/submit`;
      const method = isNew ? "PATCH" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
      setOpen(false);
      setEditing(false);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isAlreadySubmitted = status === "SUBMITTED" || !!submittedAt;

  // ── Already submitted: show log card ──────────────────────────────────────
  if (isAlreadySubmitted && !open && !editing) {
    return (
      <div className="rounded-xl border p-5 animate-slide-up" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" style={{ color: "#2EAD6B" }} />
            <h3 className="font-semibold" style={{ color: "var(--navy)" }}>Application Submitted</h3>
          </div>
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--gold)" }}>
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>

        <dl className="space-y-0 text-sm">
          {[
            { label: "Submitted", value: submittedAt ? new Date(submittedAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "—" },
            { label: "Method", value: submissionMethod ?? "—" },
            { label: "Reference #", value: submissionReference || "—" },
            { label: "Portal", value: submissionPortal || "—", link: submissionPortal },
            { label: "Notes", value: submissionNotes || "—" },
            { label: "Follow-up date", value: followUpDate ? new Date(followUpDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "Not set" },
          ].map(({ label, value, link }) => (
            <div key={label} className="flex justify-between gap-4 py-2 border-b last:border-0" style={{ borderColor: "var(--warm-gray)" }}>
              <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
              <dd className="font-medium text-right" style={{ color: "var(--navy)" }}>
                {link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline" style={{ color: "var(--gold)" }}>
                    {value.length > 35 ? value.slice(0, 35) + "…" : value}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  // ── Edit existing submission ───────────────────────────────────────────────
  if (editing) {
    return (
      <div className="rounded-xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: "var(--navy)" }}>Edit Submission Record</h3>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-muted)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <SubmissionForm form={form} setForm={setForm} funderWebsite={funderWebsite} />
        {error && <p className="text-xs mt-2" style={{ color: "#DC2626" }}>{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border py-2 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            Cancel
          </button>
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex-1 rounded-lg py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  // ── Submit button (not yet submitted) ─────────────────────────────────────
  if (!open) {
    return (
      <button onClick={() => { setStep("checklist"); setOpen(true); }}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #2EAD6B, #1A8A55)" }}>
        <Send className="h-4 w-4" />
        Submit Application
      </button>
    );
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal-panel w-full max-w-lg mx-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: "white" }}>

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--gold)" }}>
                {step === "checklist" ? "Step 1 of 2 · Pre-flight Check" : "Step 2 of 2 · Record Submission"}
              </p>
              <h2 className="font-serif text-lg font-semibold" style={{ color: "var(--navy)" }}>
                {step === "checklist" ? "Ready to Submit?" : "Record Submission Details"}
              </h2>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "var(--text-muted)" }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 px-6 pt-4">
            {(["checklist", "record"] as Step[]).map((s, i) => (
              <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: step === s || (i === 0 && step === "record") ? "var(--gold)" : "var(--warm-gray)" }} />
            ))}
          </div>

          <div className="px-6 py-5">
            {step === "checklist" ? (
              <>
                {/* Checklist */}
                <div className="rounded-xl p-4 mb-4" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Application Requirements
                  </p>
                  <CheckItem
                    ok={allRequiredDone}
                    label={allRequiredDone
                      ? `All required sections complete (${completedRequired}/${requiredSections.length})`
                      : `${completedRequired}/${requiredSections.length} required sections complete — finish before submitting`}
                  />
                  <CheckItem
                    ok={scoreOk}
                    warn={scoreWarn}
                    label={complianceScore == null
                      ? "Compliance not yet checked — run a check first"
                      : `Compliance score: ${complianceScore}/100${scoreOk ? " ✓" : scoreWarn ? " (aim for 70+)" : " — needs improvement"}`}
                  />
                  <CheckItem
                    ok={deadlineOk}
                    label={!deadline
                      ? "No deadline set"
                      : deadlineOk
                        ? `Deadline: ${new Date(deadline).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} (${daysLeft}d remaining)`
                        : "Deadline has passed"}
                  />
                </div>

                {/* Export */}
                <div className="rounded-xl p-4 mb-4" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Export Your Application
                  </p>
                  <div className="flex gap-2">
                    {["pdf", "docx", "txt"].map((fmt) => (
                      <a key={fmt} href={`/api/grants/${grantId}/export?format=${fmt}`}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors flex-1 justify-center"
                        style={{ borderColor: "var(--border)", color: "var(--navy)", background: "white" }}>
                        <Download className="h-3.5 w-3.5" />
                        {fmt.toUpperCase()}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Funder portal */}
                {funderWebsite && (
                  <a href={funderWebsite} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl p-4 mb-4 transition-colors"
                    style={{ background: "rgba(46,173,107,0.06)", border: "1px solid rgba(46,173,107,0.25)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1A8A55" }}>Open {funderName} Portal</p>
                      <p className="text-xs mt-0.5" style={{ color: "#2EAD6B" }}>Submit your application there, then come back to record details</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0" style={{ color: "#2EAD6B" }} />
                  </a>
                )}

                {!readyToSubmit && (
                  <p className="text-xs text-center mb-3" style={{ color: "var(--text-muted)" }}>
                    You can still proceed — fix issues before submitting to the funder.
                  </p>
                )}

                <button onClick={() => setStep("record")}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                  I've Submitted — Record Details
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                {/* Record form */}
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                  Record where and how you submitted so you can track it and get a follow-up reminder.
                </p>

                <SubmissionForm form={form} setForm={setForm} funderWebsite={funderWebsite} />

                {error && <p className="text-xs mt-2" style={{ color: "#DC2626" }}>{error}</p>}

                <div className="flex gap-2 mt-5">
                  <button onClick={() => setStep("checklist")}
                    className="rounded-lg border px-4 py-2.5 text-sm font-medium"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    Back
                  </button>
                  <button onClick={() => handleSave(true)} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #2EAD6B, #1A8A55)", opacity: saving ? 0.6 : 1 }}>
                    <ClipboardCheck className="h-4 w-4" />
                    {saving ? "Saving…" : "Save & Mark as Submitted"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared form fields ────────────────────────────────────────────────────────

function SubmissionForm({ form, setForm, funderWebsite }: {
  form: {
    submittedAt: string; submissionMethod: string; submissionPortal: string;
    submissionReference: string; submissionNotes: string; followUpDate: string;
  };
  setForm: (f: any) => void;
  funderWebsite: string | null;
}) {
  const set = (key: string, value: string) => setForm((f: any) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Date Submitted</label>
          <input type="date" value={form.submittedAt} onChange={(e) => set("submittedAt", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Method</label>
          <select value={form.submissionMethod} onChange={(e) => set("submissionMethod", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
            {["Online Portal", "Email", "Mail / Post", "In Person"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
          Portal / Submission URL
        </label>
        <input type="url" value={form.submissionPortal}
          onChange={(e) => set("submissionPortal", e.target.value)}
          placeholder={funderWebsite ?? "https://"}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--navy)" }} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
          Reference / Confirmation Number
        </label>
        <input type="text" value={form.submissionReference}
          onChange={(e) => set("submissionReference", e.target.value)}
          placeholder="e.g. APP-2026-00123"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--navy)" }} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
          Notes / Confirmation Message
        </label>
        <textarea value={form.submissionNotes}
          onChange={(e) => set("submissionNotes", e.target.value)}
          rows={2} placeholder="Paste confirmation message or notes here…"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
          style={{ borderColor: "var(--border)", color: "var(--navy)" }} />
      </div>

      <div className="rounded-lg p-3" style={{ background: "rgba(196,151,74,0.06)", border: "1px solid rgba(196,151,74,0.25)" }}>
        <label className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: "var(--gold)" }}>
          <Bell className="h-3.5 w-3.5" />
          Follow-up Reminder Date
        </label>
        <input type="date" value={form.followUpDate}
          onChange={(e) => set("followUpDate", e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "rgba(196,151,74,0.3)", color: "var(--navy)" }} />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          We'll surface this on your dashboard to remind you to follow up.
        </p>
      </div>
    </div>
  );
}
