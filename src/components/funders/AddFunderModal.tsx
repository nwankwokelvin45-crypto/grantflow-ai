"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Wand2, RefreshCw, Globe, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";

const FOCUS_AREA_OPTIONS = [
  "ARTS_CULTURE","ENVIRONMENT","HEALTH","SOCIAL_SERVICES","EDUCATION",
  "INDIGENOUS","SPORT_RECREATION","ECONOMIC_DEVELOPMENT","HOUSING",
  "FOOD_SECURITY","SENIORS","YOUTH","DISABILITY","IMMIGRATION","LGBTQ","ANIMAL_WELFARE","OTHER",
];
const FUNDING_TYPE_OPTIONS = ["PROJECT","OPERATING","CAPITAL","CAPACITY_BUILDING","EMERGENCY"];
const ORG_TYPE_OPTIONS = ["NONPROFIT","REGISTERED_CHARITY","SOCIETY","INDIGENOUS_ORGANIZATION","GOVERNMENT","COOPERATIVE"];
const DEADLINE_TYPES = ["ANNUAL","ROLLING","BIANNUAL","QUARTERLY","CLOSED"];
const PROVINCES = ["BC","AB","ON","SK","MB","OTHER"];

interface Section { sectionKey: string; label: string; description: string; isRequired: boolean; minWords: number | null; maxWords: number | null; sortOrder: number; }

interface FunderDraft {
  name: string;
  province: string;
  website: string;
  contactEmail: string;
  description: string;
  focusAreas: string[];
  fundingTypes: string[];
  minGrantAmount: number | null;
  maxGrantAmount: number | null;
  deadlineType: string;
  deadlineNotes: string;
  eligibleOrgTypes: string[];
  acceptsOnlineApps: boolean;
  sections: Section[];
}

const EMPTY: FunderDraft = {
  name: "", province: "BC", website: "", contactEmail: "",
  description: "", focusAreas: [], fundingTypes: [], minGrantAmount: null,
  maxGrantAmount: null, deadlineType: "ANNUAL", deadlineNotes: "",
  eligibleOrgTypes: [], acceptsOnlineApps: true, sections: [],
};

function label(s: string) { return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }

export default function AddFunderModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"url" | "review">("url");
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [draft, setDraft] = useState<FunderDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  function close() {
    setOpen(false);
    setStep("url");
    setUrlInput("");
    setDraft(EMPTY);
    setScrapeError(null);
    setSaveError(null);
  }

  async function handleAnalyze() {
    if (!draft.name.trim() || !urlInput.trim()) {
      setScrapeError("Enter both a funder name and website URL.");
      return;
    }
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/ai/scrape-funder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput, name: draft.name, province: draft.province }),
      });
      const json = await res.json();
      if (!res.ok) { setScrapeError(json.error ?? "Analysis failed"); return; }

      const d = json.data;
      setDraft(prev => ({
        ...prev,
        website: json.url ?? prev.website,
        description: d.description ?? prev.description,
        focusAreas: d.focusAreas ?? prev.focusAreas,
        fundingTypes: d.fundingTypes ?? prev.fundingTypes,
        minGrantAmount: d.minGrantAmount ?? null,
        maxGrantAmount: d.maxGrantAmount ?? null,
        deadlineType: d.deadlineType ?? prev.deadlineType,
        deadlineNotes: d.deadlineNotes ?? prev.deadlineNotes,
        eligibleOrgTypes: d.eligibleOrgTypes ?? prev.eligibleOrgTypes,
        contactEmail: d.contactEmail ?? prev.contactEmail,
        acceptsOnlineApps: d.acceptsOnlineApps ?? prev.acceptsOnlineApps,
        sections: (d.sections ?? []).map((s: any, i: number) => ({
          sectionKey: s.sectionKey ?? slugify(s.label ?? `section_${i}`),
          label: s.label ?? "",
          description: s.description ?? "",
          isRequired: s.isRequired ?? true,
          minWords: s.minWords ?? null,
          maxWords: s.maxWords ?? null,
          sortOrder: i,
        })),
      }));
      setStep("review");
    } catch (err) {
      setScrapeError("Network error. Please try again.");
    } finally {
      setScraping(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/funders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error?.formErrors?.[0] ?? JSON.stringify(json.error) ?? "Save failed"); return; }
      close();
      router.refresh();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleArr(field: keyof FunderDraft, val: string) {
    setDraft(prev => {
      const arr = (prev[field] as string[]);
      return { ...prev, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }

  function addSection() {
    setDraft(prev => ({
      ...prev,
      sections: [...prev.sections, { sectionKey: `section_${prev.sections.length + 1}`, label: "", description: "", isRequired: true, minWords: null, maxWords: null, sortOrder: prev.sections.length }],
    }));
  }

  function updateSection(i: number, patch: Partial<Section>) {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx === i ? { ...s, ...patch, sectionKey: patch.label ? slugify(patch.label) : s.sectionKey } : s),
    }));
  }

  function removeSection(i: number) {
    setDraft(prev => ({ ...prev, sections: prev.sections.filter((_, idx) => idx !== i) }));
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
        style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
        <Plus className="h-4 w-4" />
        Add Funder
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--navy)" }}>Add New Funder</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {step === "url" ? "Enter the funder's website and let AI extract their requirements" : "Review and edit the extracted information"}
            </p>
          </div>
          <button onClick={close} className="rounded-lg p-2 hover:bg-gray-100" style={{ color: "var(--text-muted)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5 overflow-y-auto">

          {/* Step 1: URL + Name + Province */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Funder Name *</label>
                <input
                  value={draft.name}
                  onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Vancouver Foundation"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Province *</label>
                <select value={draft.province} onChange={e => setDraft(p => ({ ...p, province: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }}>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Website URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.org/grants"
                    className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }}
                    onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    onKeyDown={e => { if (e.key === "Enter") handleAnalyze(); }}
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={scraping || !draft.name.trim()}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all disabled:opacity-50 shrink-0"
                  style={{ background: scraping ? "var(--text-muted)" : "linear-gradient(135deg, #2EAD6B, #1A8A55)", boxShadow: scraping ? "none" : "0 4px 16px rgba(46,173,107,0.3)" }}>
                  {scraping
                    ? <><RefreshCw className="h-4 w-4 animate-spin" />Analyzing…</>
                    : <><Wand2 className="h-4 w-4" />Auto-fill with AI</>}
                </button>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                AI will fetch the page and extract grant requirements, eligibility, deadlines, and required sections automatically.
              </p>
            </div>

            {scrapeError && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {scrapeError}
              </div>
            )}
          </div>

          {/* Step 2: Review extracted data */}
          {step === "review" && (
            <>
              <div className="flex items-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">AI extracted funder requirements — review and edit below</span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Description</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none"
                  style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Focus Areas */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--navy)" }}>Focus Areas</label>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_AREA_OPTIONS.map(fa => (
                    <button key={fa} onClick={() => toggleArr("focusAreas", fa)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                      style={draft.focusAreas.includes(fa)
                        ? { background: "var(--navy)", color: "white" }
                        : { background: "var(--warm-gray)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {label(fa)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funding Types */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--navy)" }}>Funding Types</label>
                <div className="flex flex-wrap gap-1.5">
                  {FUNDING_TYPE_OPTIONS.map(ft => (
                    <button key={ft} onClick={() => toggleArr("fundingTypes", ft)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                      style={draft.fundingTypes.includes(ft)
                        ? { background: "var(--gold)", color: "white" }
                        : { background: "var(--warm-gray)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {label(ft)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amounts + Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Min Grant ($)</label>
                  <input type="number" value={draft.minGrantAmount ?? ""} onChange={e => setDraft(p => ({ ...p, minGrantAmount: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 5000" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Max Grant ($)</label>
                  <input type="number" value={draft.maxGrantAmount ?? ""} onChange={e => setDraft(p => ({ ...p, maxGrantAmount: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 100000" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Deadline Type</label>
                  <select value={draft.deadlineType} onChange={e => setDraft(p => ({ ...p, deadlineType: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }}>
                    {DEADLINE_TYPES.map(d => <option key={d} value={d}>{label(d)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Contact Email</label>
                  <input type="email" value={draft.contactEmail} onChange={e => setDraft(p => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="grants@funder.org" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Deadline Notes</label>
                <input value={draft.deadlineNotes} onChange={e => setDraft(p => ({ ...p, deadlineNotes: e.target.value }))}
                  placeholder="e.g. Applications close March 31 each year" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", color: "var(--text)", background: "var(--cream)" }} />
              </div>

              {/* Eligible Org Types */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--navy)" }}>Eligible Org Types</label>
                <div className="flex flex-wrap gap-1.5">
                  {ORG_TYPE_OPTIONS.map(ot => (
                    <button key={ot} onClick={() => toggleArr("eligibleOrgTypes", ot)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                      style={draft.eligibleOrgTypes.includes(ot)
                        ? { background: "#7C3AED", color: "white" }
                        : { background: "var(--warm-gray)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {label(ot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections accordion */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={() => setSectionsOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ background: "var(--warm-gray)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--navy)" }}>
                    Required Sections ({draft.sections.length})
                  </span>
                  {sectionsOpen ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)" }} />}
                </button>
                {sectionsOpen && (
                  <div className="p-4 space-y-3" style={{ background: "var(--surface)" }}>
                    {draft.sections.map((s, i) => (
                      <div key={i} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
                        <div className="flex gap-2">
                          <input value={s.label} onChange={e => updateSection(i, { label: e.target.value })}
                            placeholder="Section label" className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            style={{ border: "1px solid var(--border)", color: "var(--text)", background: "white" }} />
                          <button onClick={() => removeSection(i)} className="rounded p-1 hover:bg-red-50" style={{ color: "var(--text-muted)" }}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input value={s.description} onChange={e => updateSection(i, { description: e.target.value })}
                          placeholder="What this section should contain" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none"
                          style={{ border: "1px solid var(--border)", color: "var(--text)", background: "white" }} />
                        <div className="flex gap-2 items-center">
                          <input type="number" value={s.minWords ?? ""} onChange={e => updateSection(i, { minWords: e.target.value ? Number(e.target.value) : null })}
                            placeholder="Min words" className="w-24 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            style={{ border: "1px solid var(--border)", color: "var(--text)", background: "white" }} />
                          <input type="number" value={s.maxWords ?? ""} onChange={e => updateSection(i, { maxWords: e.target.value ? Number(e.target.value) : null })}
                            placeholder="Max words" className="w-24 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                            style={{ border: "1px solid var(--border)", color: "var(--text)", background: "white" }} />
                          <label className="flex items-center gap-1.5 text-xs ml-auto cursor-pointer" style={{ color: "var(--text-muted)" }}>
                            <input type="checkbox" checked={s.isRequired} onChange={e => updateSection(i, { isRequired: e.target.checked })} className="accent-emerald-600" />
                            Required
                          </label>
                        </div>
                      </div>
                    ))}
                    <button onClick={addSection}
                      className="w-full flex items-center gap-2 justify-center rounded-lg border border-dashed py-2 text-xs font-medium transition-colors hover:border-solid"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      <Plus className="h-3.5 w-3.5" /> Add section
                    </button>
                  </div>
                )}
              </div>

              {saveError && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {saveError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--border)", background: "var(--warm-gray)" }}>
          <button onClick={close} className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            Cancel
          </button>
          {step === "review" && (
            <button
              onClick={handleSave}
              disabled={saving || !draft.name.trim()}
              className="flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: saving ? "var(--text-muted)" : "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              {saving ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <>Add Funder</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
