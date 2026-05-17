"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import { URGENCY_LABEL, URGENCY_COLOR } from "@/lib/deadlines";
import { Bell, Calendar, ExternalLink, Search, Filter, Sparkles } from "lucide-react";

interface Opportunity {
  funderId: string;
  funderName: string;
  province: string;
  deadlineType: string;
  deadlineNotes: string | null;
  nextDeadline: string | null;
  daysUntil: number | null;
  urgency: "overdue" | "urgent" | "soon" | "upcoming" | "open";
  minGrantAmount: number | null;
  maxGrantAmount: number | null;
  focusAreas: string[];
  website: string | null;
}

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return "Amount varies";
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  return `From ${fmt(min!)}`;
}

function formatDeadline(iso: string | null, daysUntil: number | null, deadlineType: string) {
  if (deadlineType === "ROLLING") return "Open year-round";
  if (!iso) return "TBD";
  const date = new Date(iso).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
  if (daysUntil != null && daysUntil >= 0 && daysUntil <= 60) {
    return `${date} (${daysUntil === 0 ? "today" : `${daysUntil} days`})`;
  }
  return date;
}

interface MatchScore { id: string; score: number; reason: string; likelihood: "high" | "medium" | "low" }

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [matching, setMatching] = useState(false);
  const [showMatchOnly, setShowMatchOnly] = useState(false);

  useEffect(() => {
    fetch("/api/funders/upcoming")
      .then((r) => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setOpportunities(data);
        } else {
          setFetchError(data?.error ?? "Unexpected response from server");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[opportunities]", err);
        setFetchError("Could not load opportunities. Please refresh the page.");
        setLoading(false);
      });
  }, []);

  async function runAIMatch() {
    setMatching(true);
    const res = await fetch("/api/ai/discover", { method: "POST" });
    if (res.ok) {
      const scores = await res.json();
      setMatchScores(scores);
      setShowMatchOnly(true);
    }
    setMatching(false);
  }

  const getMatch = (funderId: string) => matchScores.find(m => m.id === funderId);

  const filtered = opportunities.filter((o) => {
    if (province !== "ALL" && o.province !== province) return false;
    if (urgencyFilter !== "ALL" && o.urgency !== urgencyFilter) return false;
    if (showMatchOnly && matchScores.length > 0) {
      const m = getMatch(o.funderId);
      if (!m || m.score < 50) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!o.funderName.toLowerCase().includes(q) &&
          !o.focusAreas.some((a) => a.toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (matchScores.length === 0) return 0;
    return (getMatch(b.funderId)?.score ?? 0) - (getMatch(a.funderId)?.score ?? 0);
  });

  const urgent = filtered.filter((o) => o.urgency === "urgent");
  const soon = filtered.filter((o) => o.urgency === "soon");
  const upcoming = filtered.filter((o) => o.urgency === "upcoming");
  const open = filtered.filter((o) => o.urgency === "open");

  return (
    <div>
      <TopNav
        title="Grant Discovery"
        subtitle="AI-matched funding opportunities for your organization"
        actions={
          <div className="flex items-center gap-2">
            {matchScores.length > 0 && (
              <button onClick={() => setShowMatchOnly(v => !v)}
                className="rounded-lg px-3 py-2 text-xs font-semibold border transition-all"
                style={{
                  borderColor: showMatchOnly ? "var(--gold)" : "var(--border)",
                  background: showMatchOnly ? "rgba(196,151,74,0.08)" : "white",
                  color: showMatchOnly ? "var(--gold)" : "var(--text-muted)",
                }}>
                {showMatchOnly ? "Showing matches" : "Show all"}
              </button>
            )}
            <button onClick={runAIMatch} disabled={matching}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--gold), #b45309)", opacity: matching ? 0.7 : 1 }}>
              <Sparkles className="h-4 w-4" />
              {matching ? "Matching..." : matchScores.length > 0 ? "Re-match" : "AI Match"}
            </button>
            <Link href="/grants/new"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              Start Application
            </Link>
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto">

        {/* Alert banner for urgent */}
        {urgent.length > 0 && (
          <div className="mb-6 rounded-xl border p-4 flex items-start gap-3"
            style={{ background: "rgba(234,88,12,0.06)", borderColor: "rgba(234,88,12,0.3)" }}>
            <Bell className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#EA580C" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#EA580C" }}>
                {urgent.length} funder{urgent.length > 1 ? "s" : ""} closing within 14 days
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#EA580C", opacity: 0.8 }}>
                {urgent.map((o) => o.funderName).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search funders or focus areas..."
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <select value={province} onChange={(e) => setProvince(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--navy)" }}>
              <option value="ALL">All Provinces</option>
              <option value="BC">BC</option>
              <option value="AB">Alberta</option>
            </select>
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--navy)" }}>
              <option value="ALL">All Timelines</option>
              <option value="urgent">Due Soon (14 days)</option>
              <option value="soon">This Month</option>
              <option value="upcoming">Upcoming</option>
              <option value="open">Open Year-Round</option>
            </select>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-xl border p-4 text-sm" style={{ background: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.3)", color: "#DC2626" }}>
            {fetchError}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-xl border p-5 animate-pulse" style={{ background: "white", borderColor: "var(--border)" }}>
                <div className="h-4 w-48 rounded mb-2" style={{ background: "var(--warm-gray)" }} />
                <div className="h-3 w-32 rounded" style={{ background: "var(--warm-gray)" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: "white", borderColor: "var(--border)" }}>
            <Calendar className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--border)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No opportunities match your filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {[
              { label: "Closing Within 14 Days", items: urgent },
              { label: "Closing This Month", items: soon },
              { label: "Upcoming", items: upcoming },
              { label: "Open Year-Round", items: open },
            ].filter((g) => g.items.length > 0).map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                  {group.label} ({group.items.length})
                </h2>
                <div className="space-y-3">
                  {group.items.map((o) => {
                    const colors = URGENCY_COLOR[o.urgency];
                    return (
                      <div key={o.funderId} className="rounded-xl border p-5 transition-all hover:shadow-sm"
                        style={{ background: "white", borderColor: "var(--border)" }}>
                        {(() => { const m = getMatch(o.funderId); return m && (
                          <div className="flex items-center gap-2 mb-3 text-xs rounded-lg px-3 py-2"
                            style={{ background: m.score >= 75 ? "rgba(46,173,107,0.07)" : m.score >= 50 ? "rgba(196,151,74,0.07)" : "rgba(13,27,42,0.04)" }}>
                            <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: m.score >= 75 ? "#2EAD6B" : m.score >= 50 ? "var(--gold)" : "var(--text-muted)" }} />
                            <span className="font-bold" style={{ color: m.score >= 75 ? "#2EAD6B" : m.score >= 50 ? "var(--gold)" : "var(--text-muted)" }}>{m.score}% match</span>
                            <span style={{ color: "var(--text-muted)" }}>— {m.reason}</span>
                          </div>
                        ); })()}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold" style={{ color: "var(--navy)" }}>{o.funderName}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: o.province === "BC" ? "rgba(74,124,196,0.1)" : "rgba(220,38,38,0.08)", color: o.province === "BC" ? "#4A7CC4" : "#DC2626" }}>
                                {o.province}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                                style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                                {URGENCY_LABEL[o.urgency]}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 mb-3">
                              <Calendar className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {formatDeadline(o.nextDeadline, o.daysUntil, o.deadlineType)}
                              </p>
                              {o.deadlineNotes && (
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {o.deadlineNotes}</span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {o.focusAreas.slice(0, 5).map((area) => (
                                <span key={area} className="text-xs px-2 py-0.5 rounded-md"
                                  style={{ background: "var(--warm-gray)", color: "var(--navy)" }}>
                                  {area.replace(/_/g, " ").toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                              {formatAmount(o.minGrantAmount, o.maxGrantAmount)}
                            </p>
                            <div className="flex items-center gap-2">
                              {o.website && (
                                <a href={o.website} target="_blank" rel="noopener noreferrer"
                                  className="rounded-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                                  <ExternalLink className="h-3 w-3" />
                                  Website
                                </a>
                              )}
                              <Link href={`/funders/${o.funderId}`}
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                                style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
                                Requirements
                              </Link>
                              <Link href={`/grants/new`}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                                Apply →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
