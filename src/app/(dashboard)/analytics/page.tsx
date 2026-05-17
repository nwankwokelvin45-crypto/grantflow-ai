"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Sparkles, Send, BarChart2, DollarSign, Target, FileText, Zap, ClipboardList } from "lucide-react";

interface Analytics {
  summary: {
    totalGrants: number;
    successRate: number | null;
    totalRequested: number;
    totalAwarded: number;
    avgCompliance: number | null;
    aiUsageRate: number;
    avgReviewScore: number | null;
    formSubmissions: number;
  };
  byStatus: Record<string, number>;
  topFunders: { name: string; count: number }[];
  monthlyActivity: { label: string; created: number; submitted: number }[];
  submissionByStatus: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:      "#94a3b8",
  IN_REVIEW:  "var(--gold)",
  SUBMITTED:  "#4A7CC4",
  AWARDED:    "#2EAD6B",
  DECLINED:   "#DC2626",
  WITHDRAWN:  "#9ca3af",
};

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function BarChart({ data, colorKey }: { data: { label: string; value: number; color?: string }[]; colorKey?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs w-28 truncate text-right shrink-0" style={{ color: "var(--text-muted)" }}>{d.label}</span>
          <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--cream)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                background: d.color ?? colorKey ?? "var(--navy-light)",
              }} />
          </div>
          <span className="text-xs font-bold w-6 shrink-0" style={{ color: "var(--navy)" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ data }: { data: { label: string; created: number; submitted: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.created, d.submitted]), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-0.5 items-end" style={{ height: "96px" }}>
            <div className="flex-1 rounded-t transition-all duration-500"
              style={{
                height: `${Math.max(2, (d.created / max) * 96)}px`,
                background: "var(--navy-light)",
                opacity: 0.7,
              }} />
            <div className="flex-1 rounded-t transition-all duration-500"
              style={{
                height: `${Math.max(2, (d.submitted / max) * 96)}px`,
                background: "var(--gold)",
              }} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  async function askAI() {
    if (!question.trim() || asking) return;
    const q = question.trim();
    setQuestion("");
    setAsking(true);
    const res = await fetch("/api/analytics/ai-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    if (res.ok) {
      const { answer: a } = await res.json();
      setChatHistory(h => [...h, { q, a }]);
      setAnswer(a);
    }
    setAsking(false);
  }

  const SUGGESTED = [
    "Which funder have I applied to most?",
    "What is my grant success rate?",
    "How much funding have I been awarded total?",
    "Which grants have the lowest compliance score?",
  ];

  if (loading) return (
    <div className="p-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />)}
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>No analytics data</div>;

  const { summary, byStatus, topFunders, monthlyActivity, submissionByStatus } = data;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl md:text-3xl mb-1" style={{ color: "var(--navy)" }}>Analytics</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Portfolio insights, impact reporting, and AI-powered querying
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total grants", value: summary.totalGrants, icon: FileText, color: "var(--navy)" },
          { label: "Success rate", value: summary.successRate != null ? `${summary.successRate}%` : "N/A", icon: Target, color: "#2EAD6B" },
          { label: "Total requested", value: fmt$(summary.totalRequested), icon: DollarSign, color: "#4A7CC4" },
          { label: "Avg compliance", value: summary.avgCompliance != null ? `${summary.avgCompliance}` : "N/A", icon: BarChart2, color: "var(--gold)" },
          { label: "AI usage rate", value: `${summary.aiUsageRate}%`, icon: Zap, color: "#7C3AED" },
          { label: "Total awarded", value: fmt$(summary.totalAwarded), icon: TrendingUp, color: "#2EAD6B" },
          { label: "Form submissions", value: summary.formSubmissions, icon: ClipboardList, color: "#EA580C" },
          { label: "Avg review score", value: summary.avgReviewScore != null ? `${summary.avgReviewScore}` : "N/A", icon: BarChart2, color: "#4A7CC4" },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border p-4" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 shrink-0" style={{ color: card.color }} />
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</p>
              </div>
              <p className="font-bold text-xl" style={{ color: "var(--navy)" }}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Grant status breakdown */}
        <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm mb-4" style={{ color: "var(--navy)" }}>Grant status breakdown</p>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No grants yet</p>
          ) : (
            <BarChart data={Object.entries(byStatus).map(([label, value]) => ({
              label: label.replace(/_/g, " "),
              value,
              color: STATUS_COLORS[label] ?? "var(--navy-light)",
            }))} />
          )}
        </div>

        {/* Top funders */}
        <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm mb-4" style={{ color: "var(--navy)" }}>Top funders applied to</p>
          {topFunders.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No data yet</p>
          ) : (
            <BarChart data={topFunders.map(f => ({ label: f.name, value: f.count, color: "var(--navy-light)" }))} />
          )}
        </div>
      </div>

      {/* Monthly activity */}
      <div className="rounded-2xl border p-5 mb-6" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>Monthly grant activity (6 months)</p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--navy-light)", opacity: 0.7 }} />
              Created
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--gold)" }} />
              Submitted
            </span>
          </div>
        </div>
        <ActivityChart data={monthlyActivity} />
      </div>

      {/* Form submission pipeline */}
      {Object.keys(submissionByStatus).length > 0 && (
        <div className="rounded-2xl border p-5 mb-6" style={{ background: "white", borderColor: "var(--border)" }}>
          <p className="font-bold text-sm mb-4" style={{ color: "var(--navy)" }}>Form submission pipeline</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { key: "RECEIVED",     label: "Received",     color: "#4A7CC4" },
              { key: "UNDER_REVIEW", label: "Under Review", color: "var(--gold)" },
              { key: "ACCEPTED",     label: "Accepted",     color: "#2EAD6B" },
              { key: "DECLINED",     label: "Declined",     color: "#DC2626" },
            ].map(s => (
              <div key={s.key} className="flex-1 min-w-24 rounded-xl border p-3 text-center"
                style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                <p className="font-bold text-2xl" style={{ color: s.color }}>{submissionByStatus[s.key] ?? 0}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversational AI */}
      <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" style={{ color: "var(--gold)" }} />
          <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>Ask your portfolio</p>
          <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
            style={{ background: "rgba(196,151,74,0.1)", color: "var(--gold)" }}>AI</span>
        </div>

        {/* Chat history */}
        {chatHistory.length > 0 && (
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {chatHistory.map((entry, i) => (
              <div key={i}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--navy)" }}>You: {entry.q}</p>
                <div className="rounded-xl p-3 text-sm" style={{ background: "var(--cream)", color: "var(--navy)" }}>
                  {entry.a}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested questions */}
        {chatHistory.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => { setQuestion(q); }}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:border-[var(--gold)]"
                style={{ borderColor: "var(--border)", color: "var(--navy)", background: "var(--cream)" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && askAI()}
            placeholder='e.g. "Show top risks in my portfolio"'
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }} />
          <button onClick={askAI} disabled={asking || !question.trim()}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            {asking ? "..." : <><Send className="h-3.5 w-3.5" /> Ask</>}
          </button>
        </div>
      </div>
    </div>
  );
}
