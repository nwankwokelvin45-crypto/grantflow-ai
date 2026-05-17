"use client";

import { useState } from "react";
import { Sparkles, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Lightbulb, Copy, Check, Wand2 } from "lucide-react";

interface ProposalQuestion {
  id: string;
  category: string;
  question: string;
  hint: string;
  answer: string;
  custom: boolean;
  generatingAnswer?: boolean;
}

const CATEGORIES = [
  "Organization Background",
  "Project Description",
  "Budget & Financials",
  "Impact & Outcomes",
  "Sustainability",
];

interface Props {
  grantId: string;
  funderName: string;
}

export default function ProposalPanel({ grantId, funderName }: Props) {
  const [questions, setQuestions] = useState<ProposalQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingAllAnswers, setGeneratingAllAnswers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");

  async function generateQuestions() {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/grants/${grantId}/proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to generate questions.");
      setGenerating(false);
      return;
    }
    const { questions: generated } = await res.json();
    const mapped: ProposalQuestion[] = generated.map((q: { category: string; question: string; hint: string; answer?: string }, i: number) => ({
      id: `gen-${i}-${Date.now()}`,
      category: q.category,
      question: q.question,
      hint: q.hint,
      answer: q.answer ?? "",
      custom: false,
    }));
    setQuestions(mapped);
    const firstCat = mapped[0]?.category;
    if (firstCat) setExpanded(firstCat);
    setGenerating(false);
  }

  // Generate answers for all unanswered questions
  async function generateAllAnswers() {
    const unanswered = questions.filter(q => !q.answer.trim());
    if (!unanswered.length) return;
    setGeneratingAllAnswers(true);
    setError(null);

    // Mark all unanswered as generating
    setQuestions(prev => prev.map(q => !q.answer.trim() ? { ...q, generatingAnswer: true } : q));

    const res = await fetch(`/api/grants/${grantId}/proposal`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: unanswered.map(q => ({ id: q.id, question: q.question, category: q.category })) }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to generate answers.");
      setQuestions(prev => prev.map(q => ({ ...q, generatingAnswer: false })));
      setGeneratingAllAnswers(false);
      return;
    }

    const { answers } = await res.json() as { answers: { id: string; answer: string }[] };
    setQuestions(prev => prev.map(q => {
      const found = answers.find(a => a.id === q.id);
      // Fallback: match by index if IDs didn't align
      const byIndex = answers[unanswered.findIndex(u => u.id === q.id)];
      return { ...q, answer: found?.answer ?? byIndex?.answer ?? q.answer, generatingAnswer: false };
    }));
    setGeneratingAllAnswers(false);
  }

  // Generate answer for a single question
  async function generateSingleAnswer(qId: string) {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    setQuestions(prev => prev.map(x => x.id === qId ? { ...x, generatingAnswer: true } : x));

    const res = await fetch(`/api/grants/${grantId}/proposal`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ id: q.id, question: q.question, category: q.category }] }),
    });

    if (res.ok) {
      const { answers } = await res.json() as { answers: { id: string; answer: string }[] };
      const answer = answers[0]?.answer ?? "";
      setQuestions(prev => prev.map(x => x.id === qId ? { ...x, answer, generatingAnswer: false } : x));
    } else {
      setQuestions(prev => prev.map(x => x.id === qId ? { ...x, generatingAnswer: false } : x));
    }
  }

  function addCustomQuestion(category: string) {
    if (!newQuestion.trim()) return;
    setQuestions(prev => [...prev, {
      id: `custom-${Date.now()}`,
      category,
      question: newQuestion.trim(),
      hint: "",
      answer: "",
      custom: true,
    }]);
    setNewQuestion("");
    setAddingCategory(null);
  }

  function removeQuestion(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id));
  }

  function updateAnswer(id: string, answer: string) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer } : q));
  }

  function copyAnswer(id: string, answer: string) {
    if (!answer.trim()) return;
    navigator.clipboard.writeText(answer);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const answered = questions.filter(q => q.answer.trim()).length;
  const total = questions.length;
  const unansweredCount = total - answered;

  const allGrouped = CATEGORIES.map(cat => ({
    category: cat,
    items: questions.filter(q => q.category === cat),
  }));


  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-bold text-sm" style={{ color: "var(--navy)" }}>Proposal Q&amp;A</h3>
          {total > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: answered === total ? "rgba(46,173,107,0.12)" : "rgba(196,151,74,0.12)", color: answered === total ? "#2EAD6B" : "var(--gold)" }}>
              {answered}/{total} answered
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          AI-generated questions from {funderName} — answer to strengthen your proposal
        </p>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="px-4 pt-2 pb-1 shrink-0">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((answered / total) * 100)}%`, background: answered === total ? "#2EAD6B" : "var(--gold)" }} />
          </div>
        </div>
      )}

      {/* Generate all answers bar */}
      {total > 0 && unansweredCount > 0 && (
        <div className="px-4 pb-2 pt-1 shrink-0">
          <button onClick={generateAllAnswers} disabled={generatingAllAnswers}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--gold), #b45309)",
              opacity: generatingAllAnswers ? 0.7 : 1,
              boxShadow: generatingAllAnswers ? "none" : "0 3px 10px rgba(196,151,74,0.3)",
            }}>
            {generatingAllAnswers
              ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Generating {unansweredCount} answers…</>
              : <><Sparkles className="h-3.5 w-3.5" />Generate {unansweredCount} unanswered</>}
          </button>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 rounded-lg px-3 py-2 text-xs shrink-0"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {total === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(196,151,74,0.08)" }}>
              <Sparkles className="h-6 w-6" style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>
                Generate proposal Q&amp;A
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                AI will generate the questions {funderName} typically asks <strong>and draft answers</strong> based on your organization's mission, vision, and this grant's purpose.
              </p>
            </div>
            <button onClick={generateQuestions} disabled={generating}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all w-full justify-center"
              style={{
                background: "linear-gradient(135deg, var(--gold), #b45309)",
                opacity: generating ? 0.7 : 1,
                boxShadow: generating ? "none" : "0 4px 14px rgba(196,151,74,0.35)",
              }}>
              {generating
                ? <><RefreshCw className="h-4 w-4 animate-spin" />Generating…</>
                : <><Sparkles className="h-4 w-4" />Generate questions &amp; answers</>}
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-1.5">
            {/* Regenerate */}
            <button onClick={generateQuestions} disabled={generating}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border mb-2"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--cream)" }}>
              {generating
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Regenerating…</>
                : <><RefreshCw className="h-3.5 w-3.5" />Regenerate all</>}
            </button>

            {allGrouped.map(({ category, items }) => (
              <div key={category}>
                {/* Category header */}
                <button
                  onClick={() => setExpanded(e => e === category ? null : category)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all"
                  style={{ background: expanded === category ? "rgba(196,151,74,0.06)" : "transparent" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--navy)" }}>{category}</span>
                    <span className="text-xs rounded-full px-1.5 py-0.5 font-semibold"
                      style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                      {items.length}
                    </span>
                    {items.filter(q => q.answer.trim()).length > 0 && (
                      <span className="text-xs rounded-full px-1.5 py-0.5 font-semibold"
                        style={{ background: "rgba(46,173,107,0.1)", color: "#2EAD6B" }}>
                        {items.filter(q => q.answer.trim()).length} ✓
                      </span>
                    )}
                  </div>
                  {expanded === category
                    ? <ChevronUp className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    : <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />}
                </button>

                {expanded === category && (
                  <div className="space-y-2 mt-1 mb-2">
                    {items.map(q => (
                      <div key={q.id} className="rounded-xl border p-3 transition-all"
                        style={{
                          background: "white",
                          borderColor: q.answer.trim() ? "rgba(46,173,107,0.25)" : "var(--border)",
                        }}>
                        {/* Question + actions */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold leading-snug flex-1" style={{ color: "var(--navy)" }}>
                            {q.question}
                            {q.custom && (
                              <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>custom</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {q.hint && (
                              <button onClick={() => setShowHint(h => h === q.id ? null : q.id)}
                                title="Show tip"
                                className="rounded-lg p-1 transition-colors"
                                style={{ color: showHint === q.id ? "var(--gold)" : "var(--text-muted)" }}>
                                <Lightbulb className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => generateSingleAnswer(q.id)} disabled={q.generatingAnswer}
                              title="Generate answer with AI"
                              className="rounded-lg p-1 transition-colors"
                              style={{ color: "var(--gold)" }}>
                              {q.generatingAnswer
                                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                : <Wand2 className="h-3.5 w-3.5" />}
                            </button>
                            {q.answer.trim() && (
                              <button onClick={() => copyAnswer(q.id, q.answer)} title="Copy answer"
                                className="rounded-lg p-1 transition-colors"
                                style={{ color: copiedId === q.id ? "#2EAD6B" : "var(--text-muted)" }}>
                                {copiedId === q.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            <button onClick={() => removeQuestion(q.id)} title="Remove question"
                              className="rounded-lg p-1 text-red-400 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Hint */}
                        {showHint === q.id && q.hint && (
                          <div className="rounded-lg px-2.5 py-1.5 mb-2 text-xs"
                            style={{ background: "rgba(196,151,74,0.07)", color: "var(--gold)", border: "1px solid rgba(196,151,74,0.2)" }}>
                            💡 {q.hint}
                          </div>
                        )}

                        {/* Answer */}
                        {q.generatingAnswer ? (
                          <div className="rounded-lg px-3 py-4 text-xs text-center"
                            style={{ background: "var(--cream)", color: "var(--text-muted)", border: "1.5px solid var(--border)" }}>
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" style={{ color: "var(--gold)" }} />
                            Generating answer…
                          </div>
                        ) : (
                          <textarea
                            value={q.answer}
                            onChange={e => updateAnswer(q.id, e.target.value)}
                            placeholder="Type your answer, or click ✦ to generate with AI…"
                            rows={4}
                            className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none transition-all"
                            style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--text)" }}
                            onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                            onBlur={e => (e.target.style.borderColor = "var(--border)")}
                          />
                        )}
                        {q.answer.trim() && !q.generatingAnswer && (
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {q.answer.trim().split(/\s+/).length} words
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Add custom question */}
                    {addingCategory === category ? (
                      <div className="rounded-xl border p-3" style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                        <textarea autoFocus value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
                          placeholder="Enter your custom question…"
                          rows={2}
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none mb-2"
                          style={{ border: "1.5px solid var(--gold)", background: "white", color: "var(--text)" }}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addCustomQuestion(category); } }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => addCustomQuestion(category)} disabled={!newQuestion.trim()}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: !newQuestion.trim() ? 0.5 : 1 }}>
                            Add
                          </button>
                          <button onClick={() => { setAddingCategory(null); setNewQuestion(""); }}
                            className="rounded-lg px-3 py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingCategory(category)}
                        className="w-full flex items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-2 text-xs font-medium transition-all hover:border-[var(--gold)]"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                        <Plus className="h-3.5 w-3.5" /> Add question to {category}
                      </button>
                    )}
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
