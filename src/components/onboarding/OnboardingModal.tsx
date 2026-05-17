"use client";

import { useState, useEffect } from "react";
import { X, FileText, Building2, Sparkles, Bell, ArrowRight, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: Building2,
    color: "#4A7CC4",
    colorBg: "rgba(74,124,196,0.1)",
    title: "Your Funder Database",
    body: "Grant2Fund'n tracks 10+ BC and Alberta funders — their deadlines, requirements, grant amounts, and eligibility rules — all in one place.",
    tip: "Browse the Funders tab to explore what's available for your province.",
  },
  {
    icon: Bell,
    color: "#C4974A",
    colorBg: "rgba(196,151,74,0.1)",
    title: "Never Miss a Deadline",
    body: "The Opportunities page auto-detects upcoming grant deadlines and shows how many days you have left — sorted from most urgent to open year-round.",
    tip: "Check Opportunities regularly. Urgent deadlines are highlighted in orange.",
  },
  {
    icon: FileText,
    color: "#2EAD6B",
    colorBg: "rgba(46,173,107,0.1)",
    title: "Create a Grant Application",
    body: "Click New Grant to start an application. You'll pick a funder, set your amount and deadline, then fill in the required sections one by one.",
    tip: "Each funder has specific required sections. Grant2Fund'n shows you exactly what's needed.",
  },
  {
    icon: Sparkles,
    color: "#7C3AED",
    colorBg: "rgba(139,92,246,0.1)",
    title: "Let AI Write for You",
    body: "Inside the writing workspace, select any section and click Generate with AI. The AI uses your org profile and funder rules to produce funder-ready content.",
    tip: "After generating, run the Compliance Check to make sure everything meets the funder's requirements.",
  },
];

const STORAGE_KEY = "grantflow_onboarding_complete";

export default function OnboardingModal({ hasGrants }: { hasGrants: boolean }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done && !hasGrants) {
      // Small delay so the page loads first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasGrants]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <div className="modal-panel w-full max-w-md mx-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: "white" }}>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--gold)" }}>
                Getting Started · {step + 1} of {STEPS.length}
              </p>
              <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--navy)" }}>
                Welcome to Grant2Fund'n
              </h2>
            </div>
            <button onClick={dismiss}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--text-muted)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 px-6 pt-4">
            {STEPS.map((_, i) => (
              <div key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i <= step ? "var(--gold)" : "var(--warm-gray)",
                  opacity: i < step ? 0.6 : 1,
                }} />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: current.colorBg }}>
                <Icon className="h-7 w-7" style={{ color: current.color }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--navy)" }}>
                {current.title}
              </h3>
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
              {current.body}
            </p>

            <div className="flex items-start gap-2 rounded-lg p-3"
              style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: current.color }} />
              <p className="text-xs" style={{ color: "var(--navy)" }}>{current.tip}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button onClick={dismiss}
              className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Skip tour
            </button>
            <button onClick={next}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              {isLast ? "Get Started" : "Next"}
              {isLast ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
