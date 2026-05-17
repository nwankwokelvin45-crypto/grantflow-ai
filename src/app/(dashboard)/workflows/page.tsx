"use client";

import { useEffect, useState } from "react";
import { GitBranch, Plus, Trash2, Play, Pause, ChevronRight, Zap, Bell, ClipboardList, MousePointer } from "lucide-react";

const TRIGGER_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  GRANT_STATUS_CHANGE: { label: "Grant Status Change", icon: GitBranch,    color: "#4A7CC4" },
  DEADLINE_APPROACHING: { label: "Deadline Approaching", icon: Bell,        color: "#EA580C" },
  FORM_SUBMITTED:       { label: "Form Submitted",       icon: ClipboardList, color: "#7C3AED" },
  MANUAL:               { label: "Manual Trigger",       icon: MousePointer, color: "var(--gold)" },
};

const ACTION_TYPES = [
  { value: "send_email",      label: "Send email notification" },
  { value: "assign_reviewer", label: "Assign reviewer" },
  { value: "update_status",   label: "Update grant status" },
  { value: "create_task",     label: "Create task reminder" },
  { value: "wait",            label: "Wait (days)" },
  { value: "notify_team",     label: "Notify team members" },
];

interface Step { action: string; label: string; config?: Record<string, string> }
interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  steps: Step[];
  isActive: boolean;
  createdAt: string;
  _count: { runs: number };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("MANUAL");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/workflows").then(r => r.json()).then(setWorkflows).finally(() => setLoading(false));
  }, []);

  async function createWorkflow() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, trigger: newTrigger, steps: [] }),
    });
    if (res.ok) {
      const wf = await res.json();
      setWorkflows(w => [{ ...wf, _count: { runs: 0 } }, ...w]);
      setSelected({ ...wf, _count: { runs: 0 } });
      setShowNew(false);
      setNewName("");
    }
    setCreating(false);
  }

  async function saveWorkflow() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/workflows/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: selected.name, description: selected.description, trigger: selected.trigger, steps: selected.steps }),
    });
    if (res.ok) {
      const updated = await res.json();
      setWorkflows(w => w.map(x => x.id === selected.id ? { ...x, ...updated } : x));
    }
    setSaving(false);
  }

  async function toggleActive(wf: Workflow) {
    const res = await fetch(`/api/workflows/${wf.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !wf.isActive }),
    });
    if (res.ok) {
      setWorkflows(w => w.map(x => x.id === wf.id ? { ...x, isActive: !wf.isActive } : x));
      if (selected?.id === wf.id) setSelected(s => s ? { ...s, isActive: !s.isActive } : s);
    }
  }

  async function deleteWorkflow(id: string) {
    if (!confirm("Delete this workflow?")) return;
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows(w => w.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function runNow() {
    if (!selected) return;
    setRunning(true);
    await fetch(`/api/workflows/${selected.id}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setRunning(false);
    setWorkflows(w => w.map(x => x.id === selected.id ? { ...x, _count: { runs: x._count.runs + 1 } } : x));
  }

  function addStep() {
    if (!selected) return;
    const step: Step = { action: "send_email", label: ACTION_TYPES[0].label };
    setSelected(s => s ? { ...s, steps: [...s.steps, step] } : s);
  }

  function removeStep(i: number) {
    setSelected(s => s ? { ...s, steps: s.steps.filter((_, idx) => idx !== i) } : s);
  }

  function updateStep(i: number, data: Partial<Step>) {
    setSelected(s => s ? { ...s, steps: s.steps.map((st, idx) => idx === i ? { ...st, ...data } : st) } : s);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar list */}
      <div className="w-full md:w-72 border-r flex flex-col overflow-hidden"
        style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
        <div className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "white" }}>
          <h1 className="font-bold text-base" style={{ color: "var(--navy)" }}>Workflows</h1>
          <button onClick={() => setShowNew(true)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />)}
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: "var(--navy)" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No workflows yet</p>
            </div>
          ) : workflows.map(wf => {
            const T = TRIGGER_META[wf.trigger] ?? TRIGGER_META.MANUAL;
            const TIcon = T.icon;
            const isActive = selected?.id === wf.id;
            return (
              <button key={wf.id} onClick={() => setSelected(wf)}
                className="w-full rounded-xl p-3 text-left transition-all mb-1.5"
                style={{
                  background: isActive ? "white" : "transparent",
                  border: `1.5px solid ${isActive ? "var(--gold)" : "transparent"}`,
                  boxShadow: isActive ? "0 2px 8px rgba(196,151,74,0.12)" : "none",
                }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-xs truncate" style={{ color: "var(--navy)" }}>{wf.name}</p>
                  <span className={`h-2 w-2 rounded-full shrink-0`}
                    style={{ background: wf.isActive ? "#2EAD6B" : "var(--border)" }} />
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <TIcon className="h-3 w-3" style={{ color: T.color }} />
                  <span>{T.label}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {wf.steps.length} steps · {wf._count.runs} runs
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Builder */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 mr-4">
                <input value={selected.name}
                  onChange={e => setSelected(s => s ? { ...s, name: e.target.value } : s)}
                  className="font-bold text-lg bg-transparent outline-none border-b-2 border-transparent focus:border-[var(--gold)] w-full"
                  style={{ color: "var(--navy)" }} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(selected)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all"
                  style={{
                    borderColor: selected.isActive ? "#2EAD6B" : "var(--border)",
                    color: selected.isActive ? "#2EAD6B" : "var(--text-muted)",
                    background: selected.isActive ? "rgba(46,173,107,0.08)" : "white",
                  }}>
                  {selected.isActive ? <><Pause className="h-3 w-3" /> Active</> : <><Play className="h-3 w-3" /> Inactive</>}
                </button>
                <button onClick={runNow} disabled={running}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #2EAD6B, #16a34a)", opacity: running ? 0.7 : 1 }}>
                  <Play className="h-3 w-3" /> {running ? "Running..." : "Run now"}
                </button>
                <button onClick={() => deleteWorkflow(selected.id)}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Trigger */}
            <div className="rounded-2xl border p-5 mb-4" style={{ background: "white", borderColor: "var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Trigger</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TRIGGER_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button key={key} onClick={() => setSelected(s => s ? { ...s, trigger: key } : s)}
                      className="rounded-xl border p-3 text-left transition-all"
                      style={{
                        background: selected.trigger === key ? "rgba(196,151,74,0.06)" : "var(--cream)",
                        borderColor: selected.trigger === key ? "var(--gold)" : "var(--border)",
                      }}>
                      <Icon className="h-4 w-4 mb-1.5" style={{ color: meta.color }} />
                      <p className="text-xs font-semibold" style={{ color: "var(--navy)" }}>{meta.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steps */}
            <div className="rounded-2xl border p-5 mb-4" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Steps</p>
                <button onClick={addStep}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border"
                  style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
                  <Plus className="h-3 w-3" /> Add step
                </button>
              </div>

              {selected.steps.length === 0 ? (
                <div className="text-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: "var(--border)" }}>
                  <Zap className="h-6 w-6 mx-auto mb-2 opacity-30" style={{ color: "var(--navy)" }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Add steps to automate actions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "rgba(196,151,74,0.12)", color: "var(--gold)" }}>
                        {i + 1}
                      </div>
                      {i < selected.steps.length - 1 && (
                        <div className="absolute left-[22px] mt-7 h-5 w-0.5 bg-[var(--border)]" />
                      )}
                      <select value={step.action}
                        onChange={e => updateStep(i, { action: e.target.value, label: ACTION_TYPES.find(a => a.value === e.target.value)?.label ?? "" })}
                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--navy)" }}>
                        {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                      <button onClick={() => removeStep(i)} className="text-red-400 hover:bg-red-50 rounded p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-2xl border p-5 mb-4" style={{ background: "white", borderColor: "var(--border)" }}>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
                Description
              </label>
              <textarea value={selected.description ?? ""}
                onChange={e => setSelected(s => s ? { ...s, description: e.target.value } : s)}
                rows={2} placeholder="What does this workflow do?"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
            </div>

            <button onClick={saveWorkflow} disabled={saving}
              className="w-full rounded-xl py-3 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save workflow"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center hidden md:flex">
          <div className="text-center">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "var(--navy)" }} />
            <p className="font-semibold" style={{ color: "var(--navy)" }}>Select a workflow to edit</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>or create a new one</p>
            <button onClick={() => setShowNew(true)}
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              New workflow
            </button>
          </div>
        </div>
      )}

      {/* New workflow modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ background: "white", borderColor: "var(--border)" }}>
            <h2 className="font-bold text-lg mb-4" style={{ color: "var(--navy)" }}>New Workflow</h2>
            <div className="space-y-3 mb-4">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. New submission review"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
              <select value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--navy)" }}>
                {Object.entries(TRIGGER_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)} className="rounded-lg px-4 py-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
              <button onClick={createWorkflow} disabled={creating || !newName.trim()}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
