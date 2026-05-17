"use client";

import { useEffect, useState } from "react";
import { Star, Plus, Trash2, ClipboardCheck, Users, BarChart2, Eye, EyeOff } from "lucide-react";

interface Criterion { name: string; description: string; maxScore: number }
interface Rubric {
  id: string;
  name: string;
  description?: string;
  criteria: Criterion[];
  _count: { assignments: number };
}

interface Assignment {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DECLINED";
  isBlinded: boolean;
  dueDate?: string;
  grant: { id: string; title: string };
  rubric: { id: string; name: string; criteria: Criterion[] };
  reviewer: { id: string; name?: string; email: string };
  scores: { totalScore: number; criteriaScores: { criteriaName: string; score: number; notes?: string }[]; overallNotes?: string }[];
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:     { bg: "rgba(74,124,196,0.1)",  color: "#4A7CC4",     label: "Pending" },
  IN_PROGRESS: { bg: "rgba(196,151,74,0.1)",  color: "var(--gold)", label: "In Progress" },
  COMPLETED:   { bg: "rgba(46,173,107,0.1)",  color: "#2EAD6B",     label: "Completed" },
  DECLINED:    { bg: "rgba(220,38,38,0.1)",   color: "#DC2626",     label: "Declined" },
};

export default function ReviewsPage() {
  const [tab, setTab] = useState<"assignments" | "rubrics">("assignments");
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Rubric builder state
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [showNewRubric, setShowNewRubric] = useState(false);
  const [newRubricName, setNewRubricName] = useState("");
  const [creatingRubric, setCreatingRubric] = useState(false);
  const [savingRubric, setSavingRubric] = useState(false);

  // Score modal state
  const [scoringAssignment, setScoringAssignment] = useState<Assignment | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<{ criteriaName: string; score: number; notes: string }[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);

  // Reveal blind state
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/reviews/rubrics").then(r => r.json()),
      fetch("/api/reviews/assignments").then(r => r.json()),
    ]).then(([r, a]) => {
      setRubrics(Array.isArray(r) ? r : []);
      setAssignments(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));
  }, []);

  async function createRubric() {
    if (!newRubricName.trim()) return;
    setCreatingRubric(true);
    const defaultCriteria: Criterion[] = [
      { name: "Alignment with funder priorities", description: "How well the project aligns with the funder's stated objectives", maxScore: 25 },
      { name: "Project feasibility",              description: "Realistic timeline, budget, and implementation plan",           maxScore: 25 },
      { name: "Impact & outcomes",                description: "Clarity and measurability of expected results",                 maxScore: 25 },
      { name: "Organizational capacity",          description: "Demonstrated ability to deliver the project",                   maxScore: 25 },
    ];
    const res = await fetch("/api/reviews/rubrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRubricName, criteria: defaultCriteria }),
    });
    if (res.ok) {
      const rubric = await res.json();
      const full = { ...rubric, _count: { assignments: 0 } };
      setRubrics(r => [full, ...r]);
      setSelectedRubric(full);
      setShowNewRubric(false);
      setNewRubricName("");
    }
    setCreatingRubric(false);
  }

  async function saveRubric() {
    if (!selectedRubric) return;
    setSavingRubric(true);
    const res = await fetch(`/api/reviews/rubrics/${selectedRubric.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: selectedRubric.name, description: selectedRubric.description, criteria: selectedRubric.criteria }),
    });
    if (res.ok) setRubrics(r => r.map(x => x.id === selectedRubric.id ? { ...x, ...selectedRubric } : x));
    setSavingRubric(false);
  }

  async function deleteRubric(id: string) {
    if (!confirm("Delete this rubric?")) return;
    await fetch(`/api/reviews/rubrics/${id}`, { method: "DELETE" });
    setRubrics(r => r.filter(x => x.id !== id));
    if (selectedRubric?.id === id) setSelectedRubric(null);
  }

  function addCriterion() {
    if (!selectedRubric) return;
    const c: Criterion = { name: "New criterion", description: "", maxScore: 10 };
    setSelectedRubric(s => s ? { ...s, criteria: [...s.criteria, c] } : s);
  }

  function updateCriterion(i: number, data: Partial<Criterion>) {
    setSelectedRubric(s => s ? { ...s, criteria: s.criteria.map((c, idx) => idx === i ? { ...c, ...data } : c) } : s);
  }

  function removeCriterion(i: number) {
    setSelectedRubric(s => s ? { ...s, criteria: s.criteria.filter((_, idx) => idx !== i) } : s);
  }

  function openScoring(a: Assignment) {
    setScoringAssignment(a);
    setCriteriaScores(a.rubric.criteria.map(c => ({ criteriaName: c.name, score: 0, notes: "" })));
    setOverallNotes("");
  }

  async function submitScore() {
    if (!scoringAssignment) return;
    setSubmittingScore(true);
    const res = await fetch(`/api/reviews/assignments/${scoringAssignment.id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteriaScores, overallNotes }),
    });
    if (res.ok) {
      const score = await res.json();
      setAssignments(a => a.map(x => x.id === scoringAssignment.id
        ? { ...x, status: "COMPLETED", scores: [score] }
        : x
      ));
      setScoringAssignment(null);
    }
    setSubmittingScore(false);
  }

  const maxPossible = (criteria: Criterion[]) => criteria.reduce((s, c) => s + c.maxScore, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl md:text-3xl mb-1" style={{ color: "var(--navy)" }}>
            Review & Scoring
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Rubric-based scoring, blind reviews, and collaborative grant evaluation
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {(["assignments", "rubrics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all"
            style={{
              borderBottomColor: tab === t ? "var(--gold)" : "transparent",
              color: tab === t ? "var(--navy)" : "var(--text-muted)",
            }}>
            {t === "assignments" ? `Assignments (${assignments.length})` : `Rubrics (${rubrics.length})`}
          </button>
        ))}
      </div>

      {/* Assignments tab */}
      {tab === "assignments" && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />)}
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: "var(--border)" }}>
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: "var(--navy)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--navy)" }}>No review assignments</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Assign grants to reviewers from the grant detail page, or create rubrics first
              </p>
              <button onClick={() => setTab("rubrics")}
                className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                Create rubric
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => {
                const s = STATUS_STYLE[a.status];
                const score = a.scores[0];
                const max = maxPossible(a.rubric.criteria);
                const pct = score ? Math.round((score.totalScore / max) * 100) : null;
                const isRevealed = revealed.has(a.id);
                return (
                  <div key={a.id} className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
                    style={{ background: "white", borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                            {a.grant.title}
                          </p>
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: s.bg, color: s.color }}>{s.label}</span>
                          {a.isBlinded && (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>
                              Blind review
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {a.isBlinded && !isRevealed ? "Anonymous reviewer" : (a.reviewer.name ?? a.reviewer.email)}
                          </span>
                          {a.isBlinded && (
                            <button onClick={() => setRevealed(r => { const n = new Set(r); isRevealed ? n.delete(a.id) : n.add(a.id); return n; })}
                              className="flex items-center gap-0.5 font-medium" style={{ color: "var(--gold)" }}>
                              {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {isRevealed ? "Hide" : "Reveal"}
                            </button>
                          )}
                          <span>{a.rubric.name}</span>
                          {a.dueDate && <span>Due {new Date(a.dueDate).toLocaleDateString("en-CA")}</span>}
                        </div>

                        {score && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-1">
                              <BarChart2 className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                              <span className="text-xs font-semibold" style={{ color: "var(--navy)" }}>
                                {score.totalScore}/{max} points ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--cream)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background: pct! >= 75 ? "#2EAD6B" : pct! >= 50 ? "var(--gold)" : "#DC2626",
                                }} />
                            </div>
                            {score.overallNotes && (
                              <p className="text-xs mt-1.5 italic" style={{ color: "var(--text-muted)" }}>
                                &quot;{score.overallNotes}&quot;
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {a.status !== "COMPLETED" && (
                        <button onClick={() => openScoring(a)}
                          className="rounded-xl px-4 py-2 text-xs font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                          Score grant
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rubrics tab */}
      {tab === "rubrics" && (
        <div className="flex gap-6">
          {/* Rubric list */}
          <div className="w-full md:w-64 shrink-0">
            <button onClick={() => setShowNewRubric(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white mb-3"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              <Plus className="h-4 w-4" /> New rubric
            </button>
            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />)}
              </div>
            ) : rubrics.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>No rubrics yet</p>
            ) : rubrics.map(r => (
              <button key={r.id} onClick={() => setSelectedRubric(r)}
                className="w-full rounded-xl border p-3 text-left mb-1.5 transition-all"
                style={{
                  background: selectedRubric?.id === r.id ? "white" : "var(--cream)",
                  borderColor: selectedRubric?.id === r.id ? "var(--gold)" : "var(--border)",
                }}>
                <p className="font-semibold text-xs truncate" style={{ color: "var(--navy)" }}>{r.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {r.criteria.length} criteria · {maxPossible(r.criteria)}pt max · {r._count.assignments} uses
                </p>
              </button>
            ))}
          </div>

          {/* Rubric editor */}
          {selectedRubric ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <input value={selectedRubric.name}
                  onChange={e => setSelectedRubric(s => s ? { ...s, name: e.target.value } : s)}
                  className="font-bold text-lg bg-transparent outline-none border-b-2 border-transparent focus:border-[var(--gold)]"
                  style={{ color: "var(--navy)" }} />
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteRubric(selectedRubric.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {selectedRubric.criteria.map((c, i) => (
                  <div key={i} className="rounded-2xl border p-4" style={{ background: "white", borderColor: "var(--border)" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ background: "rgba(196,151,74,0.15)", color: "var(--gold)" }}>
                            {i + 1}
                          </div>
                          <input value={c.name}
                            onChange={e => updateCriterion(i, { name: e.target.value })}
                            className="flex-1 font-semibold text-sm bg-transparent outline-none border-b border-transparent focus:border-[var(--border)]"
                            style={{ color: "var(--navy)" }} />
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Max</span>
                            <input type="number" value={c.maxScore} min={1} max={100}
                              onChange={e => updateCriterion(i, { maxScore: Number(e.target.value) })}
                              className="w-14 text-center rounded-lg px-2 py-1 text-xs outline-none font-bold"
                              style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--navy)" }} />
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>pts</span>
                          </div>
                        </div>
                        <textarea value={c.description}
                          onChange={e => updateCriterion(i, { description: e.target.value })}
                          rows={1} placeholder="Describe what reviewers should evaluate..."
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
                          style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                      </div>
                      <button onClick={() => removeCriterion(i)} className="text-red-400 hover:bg-red-50 rounded p-1 mt-1 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={addCriterion}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold border"
                  style={{ borderColor: "var(--border)", color: "var(--navy)", background: "white" }}>
                  <Plus className="h-4 w-4" /> Add criterion
                </button>
                <button onClick={saveRubric} disabled={savingRubric}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: savingRubric ? 0.7 : 1 }}>
                  {savingRubric ? "Saving..." : `Save rubric · ${maxPossible(selectedRubric.criteria)}pt max`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center hidden md:flex">
              <div className="text-center">
                <Star className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: "var(--navy)" }} />
                <p className="font-semibold" style={{ color: "var(--navy)" }}>Select a rubric to edit</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score modal */}
      {scoringAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
            style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg" style={{ color: "var(--navy)" }}>Score Grant</h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{scoringAssignment.grant.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Rubric: {scoringAssignment.rubric.name}</p>
                </div>
                <button onClick={() => setScoringAssignment(null)} style={{ color: "var(--text-muted)" }}>✕</button>
              </div>

              <div className="space-y-4">
                {scoringAssignment.rubric.criteria.map((c, i) => (
                  <div key={i} className="rounded-xl border p-4" style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{c.name}</p>
                        {c.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{c.description}</p>}
                      </div>
                      <span className="text-xs font-bold shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                        / {c.maxScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={c.maxScore}
                        value={criteriaScores[i]?.score ?? 0}
                        onChange={e => setCriteriaScores(cs => cs.map((s, idx) => idx === i ? { ...s, score: Number(e.target.value) } : s))}
                        className="flex-1"
                        style={{ accentColor: "var(--gold)" }} />
                      <span className="font-bold text-sm w-8 text-center" style={{ color: "var(--gold)" }}>
                        {criteriaScores[i]?.score ?? 0}
                      </span>
                    </div>
                    <input value={criteriaScores[i]?.notes ?? ""}
                      onChange={e => setCriteriaScores(cs => cs.map((s, idx) => idx === i ? { ...s, notes: e.target.value } : s))}
                      placeholder="Notes (optional)"
                      className="w-full rounded-lg px-3 py-1.5 text-xs outline-none mt-2"
                      style={{ border: "1.5px solid var(--border)", background: "white" }} />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>
                    Overall notes
                  </label>
                  <textarea value={overallNotes} onChange={e => setOverallNotes(e.target.value)}
                    rows={3} placeholder="Summary of your evaluation..."
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm">
                    <span className="font-bold text-2xl" style={{ color: "var(--navy)" }}>
                      {criteriaScores.reduce((s, c) => s + c.score, 0)}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>
                      / {maxPossible(scoringAssignment.rubric.criteria)} pts
                    </span>
                  </div>
                  <button onClick={submitScore} disabled={submittingScore}
                    className="rounded-xl px-6 py-2.5 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: submittingScore ? 0.7 : 1 }}>
                    {submittingScore ? "Submitting..." : "Submit score"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New rubric modal */}
      {showNewRubric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 shadow-xl" style={{ background: "white", borderColor: "var(--border)" }}>
            <h2 className="font-bold text-lg mb-4" style={{ color: "var(--navy)" }}>New Rubric</h2>
            <input autoFocus value={newRubricName} onChange={e => setNewRubricName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createRubric()}
              placeholder="e.g. Standard grant evaluation"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
              style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              A default set of 4 criteria (100pt total) will be created. You can customize them.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewRubric(false)} className="rounded-lg px-4 py-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
              <button onClick={createRubric} disabled={creatingRubric || !newRubricName.trim()}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: creatingRubric ? 0.7 : 1 }}>
                {creatingRubric ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
