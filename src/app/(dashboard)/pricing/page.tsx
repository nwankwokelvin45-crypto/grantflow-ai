"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "Perfect for getting started",
    features: [
      "1 organization profile",
      "3 active grant applications",
      "1 team member",
      "25 AI generations / month",
      "75+ BC & Alberta funders",
      "PDF & DOCX export",
      "Compliance scoring",
    ],
    cta: "Current plan",
    href: null,
    highlight: false,
    current: true,
  },
  {
    key: "STARTER",
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 39,
    desc: "For growing nonprofits",
    features: [
      "1 organization profile",
      "10 active grant applications",
      "3 team members",
      "50 AI generations / month",
      "Everything in Free",
      "Follow-up reminders",
      "Weekly email digest",
      "Priority support",
    ],
    cta: "Upgrade to Starter",
    highlight: false,
    current: false,
  },
  {
    key: "PRO",
    name: "Pro",
    monthlyPrice: 99,
    annualPrice: 79,
    desc: "For consultants & established organizations",
    features: [
      "Up to 10 organization profiles",
      "Unlimited grant applications",
      "10 team members",
      "Unlimited AI generations",
      "Everything in Starter",
      "Grant duplication",
      "Version history",
      "Advanced compliance",
      "Document storage (25MB/file)",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    current: false,
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    monthlyPrice: 299,
    annualPrice: 239,
    desc: "For agencies managing many nonprofits",
    features: [
      "Up to 50 organization profiles",
      "Unlimited grant applications",
      "Unlimited team members",
      "Unlimited AI generations",
      "Everything in Pro",
      "Custom branding",
      "Dedicated support",
      "SLA guarantee",
      "API access",
    ],
    cta: "Contact us",
    highlight: false,
    current: false,
  },
];

export default function DashboardPricingPage() {
  const [annual, setAnnual] = useState(false);
  const [upgrading, setUpgrading] = useState("");

  async function handleUpgrade(tier: string) {
    if (tier === "ENTERPRISE") {
      window.location.href = "mailto:hello@grant2fundn.ca";
      return;
    }
    setUpgrading(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, annual }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error ?? "Failed to start checkout");
    } finally {
      setUpgrading("");
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2" style={{ color: "var(--navy)" }}>
          Plans &amp; Pricing
        </h1>
        <p className="text-base max-w-lg mx-auto mb-8" style={{ color: "var(--text-muted)" }}>
          Upgrade your plan to unlock more grants, team members, and AI power.
        </p>

        {/* Billing toggle */}
        <div
          className="inline-flex items-center gap-2 rounded-full border px-2 py-2"
          style={{ background: "white", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setAnnual(false)}
            className="rounded-full px-5 py-1.5 text-sm font-semibold transition-all"
            style={!annual ? { background: "var(--navy)", color: "white" } : { color: "var(--text-muted)" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="rounded-full px-5 py-1.5 text-sm font-semibold transition-all flex items-center gap-2"
            style={annual ? { background: "var(--navy)", color: "white" } : { color: "var(--text-muted)" }}
          >
            Annual
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={
                annual
                  ? { background: "rgba(196,151,74,0.25)", color: "var(--gold)" }
                  : { background: "rgba(46,173,107,0.12)", color: "#2EAD6B" }
              }
            >
              Save 20%
            </span>
          </button>
        </div>
        {annual && (
          <p className="mt-2 text-sm" style={{ color: "#2EAD6B" }}>
            2 months free — billed annually
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const displayPrice = annual ? plan.annualPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.name}
              className="rounded-2xl border p-6 flex flex-col"
              style={{
                background: plan.highlight ? "var(--navy)" : "white",
                borderColor: plan.highlight ? "var(--navy)" : "var(--border)",
                boxShadow: plan.highlight ? "0 8px 40px rgba(13,27,42,0.2)" : undefined,
              }}
            >
              {plan.highlight && (
                <div className="text-center mb-4">
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "rgba(196,151,74,0.2)", color: "var(--gold)" }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              <h2 className="font-serif font-bold text-xl" style={{ color: plan.highlight ? "white" : "var(--navy)" }}>
                {plan.name}
              </h2>
              <p
                className="text-xs mt-1 mb-4"
                style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}
              >
                {plan.desc}
              </p>

              {/* Price block */}
              <div className="mb-4">
                {displayPrice === 0 ? (
                  <span className="text-4xl font-bold" style={{ color: plan.highlight ? "var(--gold)" : "var(--navy)" }}>
                    Free
                  </span>
                ) : (
                  <>
                    {annual && (
                      <span
                        className="text-sm line-through mr-1.5"
                        style={{ color: plan.highlight ? "rgba(255,255,255,0.35)" : "var(--text-muted)" }}
                      >
                        ${plan.monthlyPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold" style={{ color: plan.highlight ? "var(--gold)" : "var(--navy)" }}>
                      ${displayPrice}
                    </span>
                    <span
                      className="text-sm ml-1"
                      style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}
                    >
                      /mo
                    </span>
                  </>
                )}

                {/* Annual/monthly subtotal */}
                {displayPrice === 0 ? (
                  <p className="text-xs mt-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
                    no credit card required
                  </p>
                ) : annual ? (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "var(--navy)" }}>
                      ${plan.annualPrice * 12} / year
                    </p>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(46,173,107,0.15)", color: "#2EAD6B" }}>
                      save ${(plan.monthlyPrice - plan.annualPrice) * 12}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs mt-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
                    ${plan.monthlyPrice * 12} / year if billed monthly
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{ color: plan.highlight ? "var(--gold)" : "#2EAD6B" }}
                    />
                    <span style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : "var(--text)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.current ? (
                <div
                  className="block text-center rounded-xl py-3 text-sm font-semibold"
                  style={{ background: "var(--cream)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  Current plan
                </div>
              ) : (
                <button
                  disabled={upgrading === plan.key}
                  onClick={() => handleUpgrade(plan.key)}
                  className="block w-full text-center rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={
                    plan.highlight
                      ? { background: "var(--gold)", color: "var(--navy)" }
                      : { background: "linear-gradient(135deg, var(--navy-light), var(--navy))", color: "white" }
                  }
                >
                  {upgrading === plan.key ? "Redirecting..." : plan.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16 mb-8">
        <h2 className="font-serif font-bold text-xl text-center mb-6" style={{ color: "var(--navy)" }}>
          Common questions
        </h2>
        <div className="space-y-3">
          {[
            { q: "Is there a free trial?", a: "All paid plans include a 14-day free trial. No credit card required." },
            { q: "How does annual billing work?", a: "Pay for 12 months upfront at the discounted rate — equivalent to 2+ months free." },
            { q: "Can I switch plans?", a: "Yes — upgrade or downgrade any time from Settings → Billing." },
            { q: "What counts as an AI generation?", a: "Each time you use AI to write or rewrite a section counts as one generation." },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-xl border p-5"
              style={{ background: "white", borderColor: "var(--border)" }}
            >
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>{item.q}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
