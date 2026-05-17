"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  step: number;
  order: number;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
}

export default function PublicFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<Record<string, string | string[]>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/forms/${formId}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); return; }
        const f = await r.json();
        if (f.status !== "PUBLISHED") { setNotFound(true); return; }
        setForm(f);
      })
      .finally(() => setLoading(false));
  }, [formId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/f/${formId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, data }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setError(d.error ?? "Submission failed. Please try again.");
    }
  }

  function renderField(field: Field) {
    const val = data[field.id] as string ?? "";
    const set = (v: string | string[]) => setData(d => ({ ...d, [field.id]: v }));

    switch (field.type) {
      case "SECTION_HEADER":
        return (
          <div className="pt-4">
            <h2 className="font-bold text-lg border-b pb-2" style={{ color: "var(--navy)", borderColor: "var(--border)" }}>
              {field.label}
            </h2>
          </div>
        );
      case "LONG_TEXT":
        return (
          <textarea value={val} onChange={e => set(e.target.value)} required={field.required}
            placeholder={field.placeholder}
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
            style={{ border: "1.5px solid var(--border)", background: "white" }} />
        );
      case "DROPDOWN":
        return (
          <select value={val} onChange={e => set(e.target.value)} required={field.required}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: val ? "var(--navy)" : "var(--text-muted)" }}>
            <option value="">Select an option...</option>
            {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case "CHECKBOXES":
        return (
          <div className="space-y-2">
            {(field.options ?? []).map(o => {
              const checked = Array.isArray(data[field.id]) ? (data[field.id] as string[]).includes(o) : false;
              return (
                <label key={o} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={checked}
                    onChange={e => {
                      const cur = Array.isArray(data[field.id]) ? (data[field.id] as string[]) : [];
                      set(e.target.checked ? [...cur, o] : cur.filter(x => x !== o));
                    }}
                    className="h-4 w-4 rounded" style={{ accentColor: "var(--navy)" }} />
                  <span className="text-sm" style={{ color: "var(--navy)" }}>{o}</span>
                </label>
              );
            })}
          </div>
        );
      case "RADIO":
        return (
          <div className="space-y-2">
            {(field.options ?? []).map(o => (
              <label key={o} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={field.id} value={o} checked={val === o}
                  onChange={() => set(o)} required={field.required}
                  className="h-4 w-4" style={{ accentColor: "var(--navy)" }} />
                <span className="text-sm" style={{ color: "var(--navy)" }}>{o}</span>
              </label>
            ))}
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            📎 File upload (configure storage to enable)
          </div>
        );
      default:
        return (
          <input
            type={field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : field.type === "PHONE" ? "tel" : "text"}
            value={val} onChange={e => set(e.target.value)}
            required={field.required} placeholder={field.placeholder}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white" }} />
        );
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="text-center">
        <p className="font-bold text-xl mb-2" style={{ color: "var(--navy)" }}>Form not available</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>This form may not be published or may no longer exist.</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
          style={{ background: "rgba(46,173,107,0.1)" }}>✅</div>
        <h2 className="font-bold text-2xl mb-2" style={{ color: "var(--navy)" }}>Submitted!</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Thank you for your submission. You will be notified of any updates.
        </p>
      </div>
    </div>
  );

  if (!form) return null;

  const fields = form.fields.sort((a, b) => a.step - b.step || a.order - b.order);

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--cream)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="Grant2Fund'n" width={40} height={40} className="rounded-xl mx-auto mb-4" />
          <h1 className="font-serif font-bold text-2xl md:text-3xl mb-2" style={{ color: "var(--navy)" }}>
            {form.title}
          </h1>
          {form.description && (
            <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
              {form.description}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border p-6 md:p-8 shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
            {error && (
              <div className="rounded-lg px-4 py-3 mb-6 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                {error}
              </div>
            )}

            {/* Applicant info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>
                  Full name
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>
                  Email address
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@organization.org"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
              </div>
            </div>

            {/* Dynamic fields */}
            <div className="space-y-5">
              {fields.map(field => (
                <div key={field.id}>
                  {field.type !== "SECTION_HEADER" && (
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>
                      {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  {renderField(field)}
                  {field.helpText && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full rounded-xl py-3 mt-8 text-sm font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, var(--navy-light), var(--navy))",
                opacity: submitting ? 0.7 : 1,
              }}>
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Powered by Grant2Fund'n
        </p>
      </div>
    </div>
  );
}
