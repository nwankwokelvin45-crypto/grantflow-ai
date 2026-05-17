"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ExternalLink, X, Loader2, Search } from "lucide-react";

interface Match {
  sentence: string;
  similarity: number;
  url: string | null;
  sourceName: string | null;
  snippet: string | null;
}

interface Result {
  score: number;
  checked: number;
  matched: number;
  matches: Match[];
  allResults: { sentence: string; similarity: number; matched: boolean }[];
}

interface Props {
  getText: () => string; // callback to get current grant text
}

function ScoreBadge({ score }: { score: number }) {
  if (score === 0) return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
      <ShieldCheck className="h-5 w-5" style={{ color: "#10B981" }} />
      <span className="font-bold text-lg" style={{ color: "#10B981" }}>0% — Original</span>
    </div>
  );
  if (score <= 25) return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
      <ShieldAlert className="h-5 w-5" style={{ color: "#F59E0B" }} />
      <span className="font-bold text-lg" style={{ color: "#F59E0B" }}>{score}% — Low Risk</span>
    </div>
  );
  if (score <= 60) return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
      <ShieldAlert className="h-5 w-5" style={{ color: "#F97316" }} />
      <span className="font-bold text-lg" style={{ color: "#F97316" }}>{score}% — Moderate Risk</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
      <ShieldX className="h-5 w-5" style={{ color: "#EF4444" }} />
      <span className="font-bold text-lg" style={{ color: "#EF4444" }}>{score}% — High Risk</span>
    </div>
  );
}

export default function PlagiarismChecker({ getText }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    const text = getText();
    if (!text || text.trim().length < 50) {
      setError("Write at least a few sentences before checking.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/plagiarism-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Check failed."); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (!result) runCheck();
  }

  function handleRecheck() {
    setResult(null);
    runCheck();
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
        style={{ background: "var(--sky-pale)", color: "var(--sky-dark)", border: "1px solid var(--sky-soft)" }}
        title="Check for plagiarism"
      >
        <Search className="h-3.5 w-3.5" />
        Plagiarism Check
      </button>

      {/* Modal */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal-panel w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>Plagiarism Detection</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Web search powered — checks your sentences against live internet sources
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full" style={{ border: "3px solid var(--sky-soft)" }} />
                    <Loader2 className="h-8 w-8 absolute inset-0 m-auto animate-spin" style={{ color: "var(--sky)" }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold" style={{ color: "var(--text)" }}>Scanning the web...</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Searching key sentences across live internet sources</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-sm font-medium" style={{ color: "#EF4444" }}>{error}</p>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <>
                  {/* Score */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <ScoreBadge score={result.score} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {result.matched} of {result.checked} sentences matched online sources
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${result.score}%`,
                        background: result.score === 0
                          ? "#10B981"
                          : result.score <= 25
                          ? "#F59E0B"
                          : result.score <= 60
                          ? "#F97316"
                          : "#EF4444",
                      }}
                    />
                  </div>

                  {/* All sentences grid */}
                  {result.allResults.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                        Sentences Checked ({result.checked})
                      </p>
                      <div className="space-y-1.5">
                        {result.allResults.map((r, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs rounded-lg p-2.5"
                            style={{
                              background: r.matched ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
                              border: `1px solid ${r.matched ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}`,
                            }}>
                            <span className="mt-0.5 shrink-0 h-2 w-2 rounded-full"
                              style={{ background: r.matched ? "#EF4444" : "#10B981" }} />
                            <span style={{ color: "var(--text)" }} className="leading-relaxed">{r.sentence}</span>
                            <span className="ml-auto shrink-0 font-semibold"
                              style={{ color: r.matched ? "#EF4444" : "#10B981" }}>
                              {r.similarity}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched sources */}
                  {result.matches.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                        Sources Found Online
                      </p>
                      <div className="space-y-3">
                        {result.matches.map((m, i) => (
                          <div key={i} className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "#EF4444" }}>
                              {m.similarity}% similarity
                            </p>
                            <p className="text-xs italic mb-2 leading-relaxed" style={{ color: "var(--text)", borderLeft: "2px solid rgba(239,68,68,0.4)", paddingLeft: "8px" }}>
                              "{m.sentence}"
                            </p>
                            {m.snippet && (
                              <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Found: "{m.snippet}"
                              </p>
                            )}
                            {m.url && (
                              <a href={m.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                                style={{ color: "var(--sky)" }}>
                                <ExternalLink className="h-3 w-3" />
                                {m.sourceName ?? m.url}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.matches.length === 0 && result.score === 0 && (
                    <div className="rounded-xl p-5 text-center" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2" style={{ color: "#10B981" }} />
                      <p className="font-semibold" style={{ color: "#10B981" }}>No matches found</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Your grant content appears to be original.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Powered by Google web search via Serper API
              </p>
              <button
                onClick={handleRecheck}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                style={{ background: "var(--sky)", color: "#fff", opacity: loading ? 0.6 : 1 }}
              >
                <Search className="h-3.5 w-3.5" />
                {loading ? "Scanning..." : "Re-check"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
