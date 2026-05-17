"use client";

import { useState, useRef } from "react";
import { cn, countWords } from "@/lib/utils";
import ComplianceScore from "@/components/compliance/ComplianceScore";
import ComplianceChecklist from "@/components/compliance/ComplianceChecklist";
import { Wand2, RefreshCw, Save, CheckCircle, AlertCircle, ClipboardList, ChevronLeft, ChevronRight, Maximize2, Minimize2, GripVertical, LayoutDashboard, Plus, Trash2, Paperclip, FileText, ImageIcon, File, Upload, ExternalLink } from "lucide-react";
import ProposalPanel from "@/components/writing/ProposalPanel";

interface Section {
  id: string;
  sectionKey: string;
  label: string;
  content: string | null;
  wordCount: number;
  isComplete: boolean;
  aiGenerated: boolean;
  sortOrder: number;
}

interface FunderSection {
  sectionKey: string;
  label: string;
  description: string | null;
  isRequired: boolean;
  minWords: number | null;
  maxWords: number | null;
}

interface Props {
  grantId: string;
  funderName: string;
  funderSections: FunderSection[];
  initialSections: Section[];
  initialScore: number | null;
}

export default function WritingWorkspace({
  grantId,
  funderName,
  funderSections,
  initialSections,
  initialScore,
}: Props) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activeSectionKey, setActiveSectionKey] = useState<string>(
    initialSections[0]?.sectionKey ?? ""
  );
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState<"professional" | "warm" | "formal">("professional");
  const [wordTarget, setWordTarget] = useState(300);
  const [score, setScore] = useState<number | null>(initialScore);
  const [issues, setIssues] = useState<any[]>([]);
  const [showCompliance, setShowCompliance] = useState(false);
  const [checkingCompliance, setCheckingCompliance] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeSection = sections.find((s) => s.sectionKey === activeSectionKey);
  const funderSection = funderSections.find((s) => s.sectionKey === activeSectionKey);

  const currentContent = activeSection?.content ?? "";
  const currentWordCount = countWords(currentContent);

  function updateSectionContent(key: string, content: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.sectionKey === key
          ? { ...s, content, wordCount: countWords(content) }
          : s
      )
    );
  }

  async function saveSection(key: string, content: string) {
    setSaving(true);
    try {
      await fetch(`/api/grants/${grantId}/sections?key=${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function generateAI() {
    if (streaming) return;
    setStreaming(true);
    setStreamText("");
    setAiError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId, sectionKey: activeSectionKey, tone, wordTarget }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setAiError(`AI limit reached. You've used all ${data.limit} generations this month. Upgrade your plan to continue.`);
        } else if (res.status === 429) {
          setAiError("Too many requests. Please wait a moment and try again.");
        } else if (res.status === 401) {
          setAiError("Session expired. Please refresh the page and sign in again.");
        } else {
          setAiError(data.error ?? `Request failed (${res.status}).`);
        }
        return;
      }

      if (!res.body) {
        setAiError("No response body received from server.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamText(accumulated);
              }
            } catch {}
          }
        }
      }

      if (accumulated) {
        updateSectionContent(activeSectionKey, accumulated);
        setSections((prev) =>
          prev.map((s) =>
            s.sectionKey === activeSectionKey
              ? { ...s, aiGenerated: true, isComplete: true }
              : s
          )
        );
      } else {
        setAiError("No content was generated. The OpenAI API may be unavailable or the key may be invalid.");
      }
    } catch (err) {
      setAiError(`Network error: ${err instanceof Error ? err.message : "Could not reach server."}`);
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  }

  async function checkCompliance() {
    setCheckingCompliance(true);
    setShowCompliance(true);
    try {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId }),
      });
      const data = await res.json();
      setScore(data.score);
      setIssues(data.issues ?? []);
    } finally {
      setCheckingCompliance(false);
    }
  }

  const displayContent = streaming && streamText ? streamText : currentContent;

  // Documents panel state
  interface GrantDoc { id: string; name: string; mimeType: string; sizeBytes: number; category: string; signedUrl: string | null; attached: boolean; }
  const [grantDocs, setGrantDocs] = useState<GrantDoc[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);

  async function loadGrantDocs() {
    if (docsLoading) return;
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/grants/${grantId}/documents`);
      if (res.ok) { setGrantDocs(await res.json()); setDocsLoaded(true); }
    } finally { setDocsLoading(false); }
  }

  async function toggleAttach(doc: GrantDoc) {
    if (doc.attached) {
      await fetch(`/api/grants/${grantId}/documents?documentId=${doc.id}`, { method: "DELETE" });
      setGrantDocs(prev => prev.map(d => d.id === doc.id ? { ...d, attached: false } : d));
    } else {
      await fetch(`/api/grants/${grantId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      setGrantDocs(prev => prev.map(d => d.id === doc.id ? { ...d, attached: true } : d));
    }
  }

  async function uploadAndAttach(file: File) {
    setDocUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      if (!res.ok) { alert("Upload failed"); return; }
      const newDoc = await res.json();
      // Attach to grant immediately
      await fetch(`/api/grants/${grantId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: newDoc.id }),
      });
      setGrantDocs(prev => [{ ...newDoc, signedUrl: `/uploads/${newDoc.storageKey}`, attached: true }, ...prev]);
    } finally { setDocUploading(false); }
  }

  function getDocIcon(mime: string) {
    if (mime.startsWith("image/")) return ImageIcon;
    if (mime.includes("pdf")) return FileText;
    return File;
  }

  function fmtBytes(b: number) {
    if (b < 1024) return `${b}B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
    return `${(b / (1024 * 1024)).toFixed(1)}MB`;
  }

  const DocsPanel = (
    <div className="flex flex-col h-full" style={{ background: "var(--surface)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Attach supporting documents to this grant (financials, letters of support, etc.)
        </p>
      </div>

      {!docsLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={loadGrantDocs}
            disabled={docsLoading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            {docsLoading ? <><RefreshCw className="h-4 w-4 animate-spin" />Loading…</> : <><Paperclip className="h-4 w-4" />Load Documents</>}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Upload new */}
          <input ref={docInputRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndAttach(f); e.target.value = ""; }} />
          <button
            onClick={() => docInputRef.current?.click()}
            disabled={docUploading}
            className="w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs font-medium transition-colors hover:border-solid disabled:opacity-50"
            style={{ borderColor: "var(--gold)", color: "var(--gold)", background: "rgba(196,151,74,0.04)" }}>
            {docUploading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Uploading…</> : <><Upload className="h-3.5 w-3.5" />Upload & attach new file</>}
          </button>

          {grantDocs.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: "var(--text-muted)" }}>
              No documents in your vault yet.<br />Upload one above.
            </div>
          ) : (
            grantDocs.map(doc => {
              const Icon = getDocIcon(doc.mimeType);
              return (
                <div key={doc.id}
                  className="rounded-lg border p-2.5 flex items-center gap-2.5 transition-all"
                  style={{
                    borderColor: doc.attached ? "var(--gold)" : "var(--border)",
                    background: doc.attached ? "rgba(196,151,74,0.06)" : "white",
                  }}>
                  <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md" style={{ background: "var(--warm-gray)" }}>
                    <Icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--navy)" }}>{doc.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {fmtBytes(doc.sizeBytes)} · {doc.category.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.signedUrl && (
                      <a href={doc.signedUrl} target="_blank" rel="noreferrer" title="Open"
                        className="rounded p-1 hover:bg-gray-100"
                        style={{ color: "var(--text-muted)" }}>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={() => toggleAttach(doc)}
                      title={doc.attached ? "Detach" : "Attach"}
                      className="rounded-md px-2 py-1 text-[10px] font-bold transition-colors"
                      style={doc.attached
                        ? { background: "var(--gold)", color: "white" }
                        : { border: "1.5px solid var(--border)", color: "var(--text-muted)", background: "transparent" }}>
                      {doc.attached ? "Attached" : "Attach"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );

  // Panel layout state
  type PanelId = "sections" | "editor" | "proposal" | "ai" | "docs";
  const [panelOrder, setPanelOrder] = useState<PanelId[]>(["sections", "editor", "proposal", "ai", "docs"]);
  const [collapsed, setCollapsed] = useState<Set<PanelId>>(new Set());
  const [expanded, setExpanded] = useState<PanelId | null>(null);
  const [dragging, setDragging] = useState<PanelId | null>(null);
  const [dragOver, setDragOver] = useState<PanelId | null>(null);

  function toggleCollapse(id: PanelId) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else {
        next.add(id);
        if (expanded === id) setExpanded(null);
      }
      return next;
    });
  }

  function toggleExpand(id: PanelId) {
    setExpanded(prev => prev === id ? null : id);
    setCollapsed(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  function handleDragStart(id: PanelId) { setDragging(id); }
  function handleDragOver(e: React.DragEvent, id: PanelId) { e.preventDefault(); setDragOver(id); }
  function handleDrop(targetId: PanelId) {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    setPanelOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(dragging);
      const to = next.indexOf(targetId);
      next.splice(from, 1);
      next.splice(to, 0, dragging);
      return next;
    });
    setDragging(null);
    setDragOver(null);
  }

  const PANEL_META: Record<PanelId, { label: string; icon: React.ElementType; shortLabel: string }> = {
    sections: { label: "Sections",  icon: LayoutDashboard, shortLabel: "§" },
    editor:   { label: "Editor",    icon: Save,            shortLabel: "✎" },
    proposal: { label: "Proposal",  icon: ClipboardList,   shortLabel: "Q" },
    ai:       { label: "AI",        icon: Wand2,           shortLabel: "AI" },
    docs:     { label: "Documents", icon: Paperclip,       shortLabel: "📎" },
  };

  function getPanelWidth(id: PanelId) {
    if (collapsed.has(id)) return "40px";
    if (expanded === id) return "60%";
    if (expanded !== null) return "auto"; // other panels shrink
    // default widths
    if (id === "editor") return "flex-1";
    return "288px"; // 18rem
  }

  // Mobile tab: "sections" | "write" | "ai" | "proposal"
  const [mobileTab, setMobileTab] = useState<"sections" | "write" | "ai" | "proposal" | "docs">("write");

  // Section list drag-to-reorder state
  const [sectionDragging, setSectionDragging] = useState<string | null>(null);
  const [sectionDragOver, setSectionDragOver] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [sectionSaving, setSectionSaving] = useState(false);
  const newSectionInputRef = useRef<HTMLInputElement>(null);

  async function addSection() {
    if (!newSectionLabel.trim() || sectionSaving) return;
    setSectionSaving(true);
    try {
      const res = await fetch(`/api/grants/${grantId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newSectionLabel.trim() }),
      });
      if (res.ok) {
        const section = await res.json();
        setSections(prev => [...prev, section]);
        setNewSectionLabel("");
        setAddingSection(false);
      }
    } finally {
      setSectionSaving(false);
    }
  }

  async function deleteSection(sectionKey: string) {
    await fetch(`/api/grants/${grantId}/sections?key=${sectionKey}`, { method: "DELETE" });
    setSections(prev => {
      const next = prev.filter(s => s.sectionKey !== sectionKey);
      if (activeSectionKey === sectionKey && next.length > 0) {
        setActiveSectionKey(next[0].sectionKey);
      }
      return next;
    });
  }

  function handleSectionDragStart(key: string) { setSectionDragging(key); }
  function handleSectionDragOver(e: React.DragEvent, key: string) { e.preventDefault(); setSectionDragOver(key); }
  async function handleSectionDrop(targetKey: string) {
    if (!sectionDragging || sectionDragging === targetKey) {
      setSectionDragging(null); setSectionDragOver(null); return;
    }
    const reordered = [...sections];
    const from = reordered.findIndex(s => s.sectionKey === sectionDragging);
    const to = reordered.findIndex(s => s.sectionKey === targetKey);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setSections(reordered);
    setSectionDragging(null);
    setSectionDragOver(null);
    // Persist order
    await fetch(`/api/grants/${grantId}/sections`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedKeys: reordered.map(s => s.sectionKey) }),
    });
  }

  const SectionList = (
    <nav className="p-2 space-y-1 flex flex-col">
      {sections.map((s) => {
        const isActive = s.sectionKey === activeSectionKey;
        const isDragTarget = sectionDragOver === s.sectionKey;
        return (
          <div
            key={s.sectionKey}
            draggable
            onDragStart={() => handleSectionDragStart(s.sectionKey)}
            onDragOver={e => handleSectionDragOver(e, s.sectionKey)}
            onDrop={() => handleSectionDrop(s.sectionKey)}
            onDragLeave={() => setSectionDragOver(null)}
            className="group relative rounded-lg"
            style={{
              outline: isDragTarget ? "2px dashed var(--gold)" : "none",
              outlineOffset: "-1px",
              opacity: sectionDragging === s.sectionKey ? 0.5 : 1,
            }}
          >
            <button
              onClick={() => { setActiveSectionKey(s.sectionKey); setMobileTab("write"); }}
              className={cn(
                "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors pr-8",
                !isActive && "hover:bg-gray-100"
              )}
              style={isActive
                ? { background: "linear-gradient(135deg, var(--navy-light), var(--navy))", color: "white" }
                : { color: "var(--text)" }}>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GripVertical className="h-3 w-3 shrink-0 cursor-grab" style={{ color: isActive ? "rgba(255,255,255,0.5)" : "var(--border)" }} />
                  <span className="truncate font-medium">{s.label}</span>
                </div>
                {s.isComplete
                  ? <CheckCircle className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-green-300" : "text-emerald-500")} />
                  : <AlertCircle className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-orange-200" : "text-orange-400")} />}
              </div>
              <span className={cn("text-xs ml-4", isActive ? "opacity-70" : "text-gray-400")}>
                {s.wordCount} words
              </span>
            </button>
            {/* Delete button — shown on hover */}
            <button
              onClick={e => { e.stopPropagation(); deleteSection(s.sectionKey); }}
              title="Remove section"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: isActive ? "rgba(255,255,255,0.6)" : "var(--text-muted)", background: "transparent" }}>
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {/* Add section */}
      {addingSection ? (
        <div className="rounded-lg border p-2 space-y-2 mt-1" style={{ borderColor: "var(--border)", background: "white" }}>
          <input
            ref={newSectionInputRef}
            autoFocus
            value={newSectionLabel}
            onChange={e => setNewSectionLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addSection(); if (e.key === "Escape") { setAddingSection(false); setNewSectionLabel(""); } }}
            placeholder="Section name…"
            className="w-full text-sm px-2 py-1 rounded outline-none"
            style={{ border: "1.5px solid var(--gold)", color: "var(--text)" }}
          />
          <div className="flex gap-1">
            <button
              onClick={addSection}
              disabled={sectionSaving || !newSectionLabel.trim()}
              className="flex-1 text-xs py-1 rounded font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--navy)" }}>
              {sectionSaving ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => { setAddingSection(false); setNewSectionLabel(""); }}
              className="flex-1 text-xs py-1 rounded border"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingSection(true)}
          className="w-full mt-1 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors hover:border-solid"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <Plus className="h-3.5 w-3.5" />
          Add section
        </button>
      )}
    </nav>
  );

  const EditorPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm truncate" style={{ color: "var(--navy)" }}>{funderSection?.label ?? activeSectionKey}</h2>
          {funderSection?.description && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{funderSection.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs" style={{ color: currentWordCount > (funderSection?.maxWords ?? Infinity) ? "#DC2626" : "var(--text-muted)" }}>
            {currentWordCount}{funderSection?.maxWords ? `/${funderSection.maxWords}` : ""} w
          </span>
          <button
            onClick={() => saveSection(activeSectionKey, currentContent)}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: saving ? "var(--text-muted)" : "var(--navy)" }}>
            <Save className="h-3 w-3" />
            {saving ? "Saving" : "Save"}
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto" style={{ background: "var(--cream)" }}>
        {funderSection?.maxWords && currentWordCount > funderSection.maxWords && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            Over word limit by {currentWordCount - funderSection.maxWords} words
          </div>
        )}
        <textarea
          className="w-full h-full min-h-[50vh] md:min-h-full resize-none rounded-xl border p-4 text-sm leading-relaxed focus:outline-none transition-all"
          style={{ borderColor: "var(--border)", background: "white", color: "var(--text)" }}
          placeholder={streaming ? "Generating…" : `Write your ${funderSection?.label ?? activeSectionKey} here, or use AI…`}
          value={displayContent}
          onChange={(e) => updateSectionContent(activeSectionKey, e.target.value)}
          disabled={streaming}
          onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>
    </div>
  );

  const AIPanel = (
    <div className="overflow-y-auto h-full" style={{ background: "var(--surface)" }}>
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>AI Assistant</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>For {funderName}</p>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as "professional" | "warm" | "formal")}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--text)" }}>
            <option value="professional">Professional</option>
            <option value="warm">Warm & Community-focused</option>
            <option value="formal">Formal / Government</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>
            Target: {wordTarget} words
          </label>
          <input type="range" min={100} max={1000} step={50} value={wordTarget}
            onChange={(e) => setWordTarget(Number(e.target.value))}
            className="w-full accent-emerald-600" />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            <span>100</span><span>1000</span>
          </div>
        </div>

        {aiError && (
          <div className="rounded-lg border px-3 py-2.5 text-xs leading-relaxed"
            style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
            {aiError}
          </div>
        )}

        <button onClick={generateAI} disabled={streaming}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: streaming ? "#6B7280" : "linear-gradient(135deg, #2EAD6B, #1A8A55)", boxShadow: streaming ? "none" : "0 4px 16px rgba(46,173,107,0.3)" }}>
          {streaming ? <><RefreshCw className="h-4 w-4 animate-spin" />Generating…</> : <><Wand2 className="h-4 w-4" />Generate with AI</>}
        </button>

        <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--navy)" }}>Compliance</h4>
            <ComplianceScore score={score} size="sm" showLabel={false} />
          </div>
          <button onClick={checkCompliance} disabled={checkingCompliance}
            className="w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            {checkingCompliance ? <><RefreshCw className="h-4 w-4 animate-spin" />Checking…</> : "Run Compliance Check"}
          </button>
        </div>

        {showCompliance && (
          <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Results</h4>
              <ComplianceScore score={score} size="sm" />
            </div>
            {checkingCompliance
              ? <div className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>Analysing…</div>
              : <ComplianceChecklist issues={issues} score={score} />}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Desktop panel layout ── */}
      <div className="hidden md:flex h-full w-full overflow-hidden">
        {panelOrder.map((id, idx) => {
          const meta = PANEL_META[id];
          const MetaIcon = meta.icon;
          const isCollapsed = collapsed.has(id);
          const isExpanded = expanded === id;
          const isDragTarget = dragOver === id;

          // Determine width style
          const widthStyle: React.CSSProperties = isCollapsed
            ? { width: "40px", minWidth: "40px", maxWidth: "40px", flexShrink: 0 }
            : isExpanded
            ? { width: "60%", minWidth: "60%", flexShrink: 0 }
            : id === "editor"
            ? { flex: 1, minWidth: 0 }
            : { width: "288px", minWidth: "240px", flexShrink: 0 };

          // Panel content
          let content: React.ReactNode;
          if (id === "sections") content = (
            <div className="h-full overflow-y-auto" style={{ background: "var(--warm-gray)" }}>{SectionList}</div>
          );
          else if (id === "editor") content = EditorPanel;
          else if (id === "proposal") content = <ProposalPanel grantId={grantId} funderName={funderName} />;
          else if (id === "docs") content = DocsPanel;
          else content = AIPanel;

          return (
            <div
              key={id}
              style={{
                ...widthStyle,
                borderLeft: idx > 0 ? "1px solid var(--border)" : "none",
                transition: "width 0.2s ease, min-width 0.2s ease",
                outline: isDragTarget ? "2px solid var(--gold)" : "none",
                outlineOffset: "-2px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onDragOver={e => handleDragOver(e, id)}
              onDrop={() => handleDrop(id)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Panel header bar */}
              <div
                className="flex items-center shrink-0 border-b"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                  height: "32px",
                  flexDirection: isCollapsed ? "column" : "row",
                  justifyContent: isCollapsed ? "center" : "space-between",
                  padding: isCollapsed ? "4px 0" : "0 8px",
                  gap: "4px",
                  cursor: isCollapsed ? "pointer" : "default",
                }}
                onClick={isCollapsed ? () => toggleCollapse(id) : undefined}
              >
                {isCollapsed ? (
                  /* Collapsed: vertical label */
                  <div className="flex flex-col items-center gap-1" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    <MetaIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--gold)", transform: "rotate(90deg)", writingMode: "horizontal-tb" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--navy)" }}>
                      {meta.label}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Drag handle + label */}
                    <div className="flex items-center gap-1.5 min-w-0"
                      draggable
                      onDragStart={() => handleDragStart(id)}
                      style={{ cursor: "grab" }}>
                      <GripVertical className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--border)" }} />
                      <MetaIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--gold)" }} />
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--navy)" }}>{meta.label}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => toggleExpand(id)} title={isExpanded ? "Restore" : "Expand"}
                        className="rounded p-1 transition-colors hover:bg-gray-100"
                        style={{ color: "var(--text-muted)" }}>
                        {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                      </button>
                      <button onClick={() => toggleCollapse(id)} title="Collapse"
                        className="rounded p-1 transition-colors hover:bg-gray-100"
                        style={{ color: "var(--text-muted)" }}>
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Panel content */}
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>
                  {content}
                </div>
              )}

              {/* Collapsed: expand button at bottom */}
              {isCollapsed && (
                <button onClick={() => toggleCollapse(id)}
                  className="w-full flex items-center justify-center py-2 mt-auto"
                  style={{ color: "var(--text-muted)" }}>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile tabbed layout ── */}
      <div className="flex md:hidden flex-col h-full w-full overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          {([
            { key: "sections", icon: CheckCircle, label: "Sections" },
            { key: "write", icon: Save, label: "Write" },
            { key: "proposal", icon: ClipboardList, label: "Proposal" },
            { key: "ai", icon: Wand2, label: "AI" },
            { key: "docs", icon: Paperclip, label: "Docs" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setMobileTab(key)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-all"
              style={{
                color: mobileTab === key ? "var(--navy)" : "var(--text-muted)",
                borderBottom: mobileTab === key ? "2px solid var(--gold)" : "2px solid transparent",
              }}>
              <Icon className="h-4 w-4" />
              {label}
              {key === "sections" && (
                <span className="text-[10px]">{sections.filter(s => s.isComplete).length}/{sections.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "sections" && (
            <div className="h-full overflow-y-auto" style={{ background: "var(--warm-gray)" }}>
              {SectionList}
            </div>
          )}
          {mobileTab === "write" && EditorPanel}
          {mobileTab === "proposal" && (
            <div className="h-full overflow-hidden">
              <ProposalPanel grantId={grantId} funderName={funderName} />
            </div>
          )}
          {mobileTab === "ai" && AIPanel}
          {mobileTab === "docs" && <div className="h-full overflow-hidden">{DocsPanel}</div>}
        </div>
      </div>
    </div>
  );
}
