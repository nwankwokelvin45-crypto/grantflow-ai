"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Globe, Archive,
  GripVertical, Eye, Settings2, Users, Copy, Check,
} from "lucide-react";

const FIELD_TYPES = [
  { type: "SHORT_TEXT",     label: "Short text",     emoji: "💬" },
  { type: "LONG_TEXT",      label: "Long text",      emoji: "📝" },
  { type: "EMAIL",          label: "Email",          emoji: "✉️" },
  { type: "PHONE",          label: "Phone",          emoji: "📞" },
  { type: "NUMBER",         label: "Number",         emoji: "🔢" },
  { type: "DATE",           label: "Date",           emoji: "📅" },
  { type: "DROPDOWN",       label: "Dropdown",       emoji: "📋" },
  { type: "CHECKBOXES",     label: "Checkboxes",     emoji: "☑️" },
  { type: "RADIO",          label: "Radio",          emoji: "🔘" },
  { type: "FILE_UPLOAD",    label: "File upload",    emoji: "📎" },
  { type: "SECTION_HEADER", label: "Section header", emoji: "📌" },
];

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[] | null;
  step: number;
  order: number;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  fields: Field[];
  _count: { submissions: number };
}

export default function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"build" | "submissions" | "settings">("build");
  const [selected, setSelected] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submissions, setSubmissions] = useState<{ id: string; name?: string; email?: string; status: string; submittedAt: string; data: Record<string, string> }[]>([]);

  const loadForm = useCallback(async () => {
    const res = await fetch(`/api/forms/${formId}`);
    if (res.ok) setForm(await res.json());
    setLoading(false);
  }, [formId]);

  useEffect(() => { loadForm(); }, [loadForm]);

  useEffect(() => {
    if (tab === "submissions") {
      fetch(`/api/forms/${formId}/submissions`).then(r => r.json()).then(setSubmissions);
    }
  }, [tab, formId]);

  async function addField(type: string) {
    const res = await fetch(`/api/forms/${formId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label: FIELD_TYPES.find(f => f.type === type)?.label ?? "New field" }),
    });
    if (res.ok) {
      await loadForm();
    }
  }

  async function deleteField(id: string) {
    await fetch(`/api/forms/${formId}/fields/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    await loadForm();
  }

  async function updateField(id: string, data: Partial<Field>) {
    const res = await fetch(`/api/forms/${formId}/fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setForm(f => f ? { ...f, fields: f.fields.map(x => x.id === id ? updated : x) } : f);
      setSelected(updated);
    }
  }

  async function moveField(id: string, dir: "up" | "down") {
    if (!form) return;
    const fields = [...form.fields];
    const idx = fields.findIndex(f => f.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === fields.length - 1) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [fields[idx], fields[swap]] = [fields[swap], fields[idx]];
    const orderedIds = fields.map(f => f.id);
    setForm(f => f ? { ...f, fields } : f);
    await fetch(`/api/forms/${formId}/fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
  }

  async function updateFormMeta(data: Partial<Form>) {
    setSaving(true);
    const res = await fetch(`/api/forms/${formId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) setForm(f => f ? { ...f, ...data } : f);
    setSaving(false);
  }

  async function togglePublish() {
    const newStatus = form?.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await updateFormMeta({ status: newStatus });
  }

  function copyLink() {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateSubmissionStatus(submissionId: string, status: string) {
    await fetch(`/api/forms/${formId}/submissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, status }),
    });
    setSubmissions(s => s.map(x => x.id === submissionId ? { ...x, status } : x));
  }

  if (loading) return <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  if (!form) return <div className="p-8 text-center text-sm text-red-500">Form not found</div>;

  const fields = form.fields;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b"
        style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/forms" className="text-sm" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={form.title}
            onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
            onBlur={e => updateFormMeta({ title: e.target.value })}
            className="font-semibold text-sm bg-transparent outline-none border-b-2 border-transparent focus:border-[var(--gold)] px-1 py-0.5 transition-all"
            style={{ color: "var(--navy)" }} />
        </div>
        <div className="flex items-center gap-2">
          {form.status === "PUBLISHED" && (
            <button onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          )}
          <button onClick={togglePublish} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{
              background: form.status === "PUBLISHED"
                ? "linear-gradient(135deg, #d97706, #b45309)"
                : "linear-gradient(135deg, #2EAD6B, #16a34a)",
            }}>
            {form.status === "PUBLISHED" ? <Archive className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            {form.status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b px-4" style={{ background: "white", borderColor: "var(--border)" }}>
        {(["build", "submissions", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-all"
            style={{
              borderBottomColor: tab === t ? "var(--gold)" : "transparent",
              color: tab === t ? "var(--navy)" : "var(--text-muted)",
            }}>
            {t === "submissions" ? `Submissions (${form._count.submissions})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Build tab */}
      {tab === "build" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Field types panel */}
          <div className="w-48 border-r overflow-y-auto p-3 hidden md:block"
            style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{ color: "var(--text-muted)" }}>
              Add field
            </p>
            {FIELD_TYPES.map(({ type, label, emoji }) => (
              <button key={type} onClick={() => addField(type)}
                className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-all hover:bg-white text-left mb-0.5"
                style={{ color: "var(--navy)" }}>
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {fields.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-12 text-center"
                style={{ borderColor: "var(--border)" }}>
                <p className="font-semibold mb-1" style={{ color: "var(--navy)" }}>No fields yet</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                  Add fields from the left panel
                </p>
                {/* Mobile add buttons */}
                <div className="flex flex-wrap gap-2 justify-center md:hidden">
                  {FIELD_TYPES.slice(0, 4).map(({ type, label, emoji }) => (
                    <button key={type} onClick={() => addField(type)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium border"
                      style={{ borderColor: "var(--border)", background: "white", color: "var(--navy)" }}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl">
                {fields.map((field, i) => (
                  <div key={field.id}
                    onClick={() => setSelected(s => s?.id === field.id ? null : field)}
                    className="rounded-xl border p-4 cursor-pointer transition-all"
                    style={{
                      background: selected?.id === field.id ? "white" : "var(--cream)",
                      borderColor: selected?.id === field.id ? "var(--gold)" : "var(--border)",
                      boxShadow: selected?.id === field.id ? "0 4px 16px rgba(196,151,74,0.12)" : "none",
                    }}>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 shrink-0" style={{ color: "var(--border)" }} />
                      <div className="flex-1 min-w-0">
                        {field.type === "SECTION_HEADER" ? (
                          <p className="font-bold text-base" style={{ color: "var(--navy)" }}>{field.label}</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{field.label}</p>
                              {field.required && <span className="text-red-500 text-xs">*</span>}
                            </div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {FIELD_TYPES.find(f => f.type === field.type)?.emoji}{" "}
                              {FIELD_TYPES.find(f => f.type === field.type)?.label}
                              {field.placeholder && ` · "${field.placeholder}"`}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => moveField(field.id, "up")} disabled={i === 0}
                          className="rounded p-1 disabled:opacity-30 hover:bg-gray-100">
                          <ChevronUp className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                        </button>
                        <button onClick={() => moveField(field.id, "down")} disabled={i === fields.length - 1}
                          className="rounded p-1 disabled:opacity-30 hover:bg-gray-100">
                          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                        </button>
                        <button onClick={() => deleteField(field.id)}
                          className="rounded p-1 text-red-400 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile add field */}
                <div className="md:hidden mt-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Add field</p>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_TYPES.map(({ type, label, emoji }) => (
                      <button key={type} onClick={() => addField(type)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium border"
                        style={{ borderColor: "var(--border)", background: "white", color: "var(--navy)" }}>
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Field config panel */}
          {selected && (
            <div className="w-72 border-l overflow-y-auto p-4"
              style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>Field settings</p>
                <button onClick={() => setSelected(null)} className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>Label</label>
                  <input value={selected.label}
                    onChange={e => setSelected(s => s ? { ...s, label: e.target.value } : s)}
                    onBlur={e => updateField(selected.id, { label: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                </div>

                {selected.type !== "SECTION_HEADER" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>Placeholder</label>
                      <input value={selected.placeholder ?? ""}
                        onChange={e => setSelected(s => s ? { ...s, placeholder: e.target.value } : s)}
                        onBlur={e => updateField(selected.id, { placeholder: e.target.value })}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>Help text</label>
                      <textarea value={selected.helpText ?? ""}
                        onChange={e => setSelected(s => s ? { ...s, helpText: e.target.value } : s)}
                        onBlur={e => updateField(selected.id, { helpText: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                        style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold" style={{ color: "var(--navy)" }}>Required</label>
                      <button onClick={() => updateField(selected.id, { required: !selected.required })}
                        className="rounded-full transition-all h-5 w-9 relative"
                        style={{ background: selected.required ? "var(--gold)" : "var(--border)" }}>
                        <span className="absolute top-0.5 rounded-full h-4 w-4 bg-white transition-all"
                          style={{ left: selected.required ? "20px" : "2px" }} />
                      </button>
                    </div>

                    {(selected.type === "DROPDOWN" || selected.type === "CHECKBOXES" || selected.type === "RADIO") && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>
                          Options (one per line)
                        </label>
                        <textarea
                          value={(selected.options ?? []).join("\n")}
                          onChange={e => {
                            const opts = e.target.value.split("\n");
                            setSelected(s => s ? { ...s, options: opts } : s);
                          }}
                          onBlur={e => {
                            const opts = e.target.value.split("\n").filter(Boolean);
                            updateField(selected.id, { options: opts });
                          }}
                          rows={4}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                          style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>Field type</label>
                  <select value={selected.type}
                    onChange={e => {
                      updateField(selected.id, { type: e.target.value });
                      setSelected(s => s ? { ...s, type: e.target.value } : s);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--navy)" }}>
                    {FIELD_TYPES.map(f => (
                      <option key={f.type} value={f.type}>{f.emoji} {f.label}</option>
                    ))}
                  </select>
                </div>

                <button onClick={() => deleteField(selected.id)}
                  className="w-full rounded-lg py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                  Delete field
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submissions tab */}
      {tab === "submissions" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {submissions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-12 text-center" style={{ borderColor: "var(--border)" }}>
              <Users className="h-8 w-8 mx-auto mb-3 opacity-30" style={{ color: "var(--navy)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--navy)" }}>No submissions yet</p>
              {form.status !== "PUBLISHED" && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Publish the form to start receiving submissions</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {submissions.map(sub => {
                const statusColors: Record<string, { bg: string; color: string }> = {
                  RECEIVED:     { bg: "rgba(74,124,196,0.1)",  color: "#4A7CC4" },
                  UNDER_REVIEW: { bg: "rgba(196,151,74,0.1)",  color: "var(--gold)" },
                  ACCEPTED:     { bg: "rgba(46,173,107,0.1)",  color: "#2EAD6B" },
                  DECLINED:     { bg: "rgba(220,38,38,0.1)",   color: "#DC2626" },
                };
                const sc = statusColors[sub.status] ?? statusColors.RECEIVED;
                return (
                  <div key={sub.id} className="rounded-xl border p-4" style={{ background: "white", borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                          {sub.name ?? "Anonymous"}
                        </p>
                        {sub.email && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub.email}</p>}
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {new Date(sub.submittedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <select value={sub.status}
                        onChange={e => updateSubmissionStatus(sub.id, e.target.value)}
                        className="rounded-full px-3 py-1 text-xs font-semibold outline-none"
                        style={{ background: sc.bg, color: sc.color, border: "none" }}>
                        <option value="RECEIVED">Received</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {fields.filter(f => f.type !== "SECTION_HEADER").slice(0, 6).map(field => {
                        const val = sub.data[field.id];
                        if (!val) return null;
                        return (
                          <div key={field.id} className="rounded-lg p-2" style={{ background: "var(--cream)" }}>
                            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>{field.label}</p>
                            <p className="text-xs" style={{ color: "var(--navy)" }}>{String(val)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-lg space-y-5">
            <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: "var(--navy)" }}>Form settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>Title</label>
                  <input value={form.title}
                    onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                    onBlur={e => updateFormMeta({ title: e.target.value })}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>Description</label>
                  <textarea value={form.description ?? ""}
                    onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)}
                    onBlur={e => updateFormMeta({ description: e.target.value })}
                    rows={3}
                    placeholder="Optional introduction for applicants"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                </div>
              </div>
            </div>

            {form.status === "PUBLISHED" && (
              <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: "var(--navy)" }}>Share form</h3>
                <div className="flex gap-2">
                  <input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/f/${formId}`}
                    className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--text-muted)" }} />
                  <button onClick={copyLink}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <a href={`/f/${formId}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-2 text-xs font-medium" style={{ color: "var(--gold)" }}>
                  <Eye className="h-3.5 w-3.5" /> Preview public form
                </a>
              </div>
            )}

            <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: "var(--navy)" }}>Status</h3>
              <div className="flex gap-2">
                {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map(s => (
                  <button key={s} onClick={() => updateFormMeta({ status: s })}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: form.status === s ? "var(--navy)" : "var(--cream)",
                      color: form.status === s ? "white" : "var(--text-muted)",
                      border: `1.5px solid ${form.status === s ? "var(--navy)" : "var(--border)"}`,
                    }}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
