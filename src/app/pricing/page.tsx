import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started",
    features: [
      "3 active grant applications",
      "1 team member",
      "10 AI generations / month",
      "75+ BC & Alberta funders",
      "PDF & DOCX export",
      "Compliance scoring",
    ],
    cta: "Get started free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$49",
    period: "per month",
    desc: "For growing nonprofits",
    features: [
      "10 active grant applications",
      "3 team members",
      "50 AI generations / month",
      "Everything in Free",
      "Follow-up reminders",
      "Weekly email digest",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/register?plan=STARTER",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "per month",
    desc: "For established organizations",
    features: [
      "Unlimited grant applications",
      "10 team members",
      "Unlimited AI generations",
      "Everything in Starter",
      "Grant duplication",
      "Version history",
      "Advanced compliance",
      "Document storage (25MB/file)",
    ],
    cta: "Start free trial",
    href: "/register?plan=PRO",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "per month",
    desc: "For large organizations & consultants",
    features: [
      "Unlimited everything",
      "Unlimited team members",
      "Multi-organization support",
      "Everything in Pro",
      "Custom branding",
      "Dedicated support",
      "SLA guarantee",
      "API access",
    ],
    cta: "Contact us",
    href: "mailto:hello@grant2fundn.ca",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Nav */}
      <nav className="flex h-16 items-center justify-between px-10 border-b sticky top-0 z-50"
        style={{ borderColor: "var(--border)", background: "rgba(247,244,239,0.95)", backdropFilter: "blur(12px)" }}>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon.png" alt="Grant2Fund'n" width={32} height={32} className="rounded-lg" />
          <span className="font-serif font-semibold text-lg" style={{ color: "var(--navy)" }}>Grant2Fund'n</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Sign in</Link>
          <Link href="/register" className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center py-20 px-6">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6 border"
          style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.3)", color: "var(--gold)" }}>
          Simple, transparent pricing
        </div>
        <h1 className="font-serif font-bold text-4xl md:text-5xl mb-4" style={{ color: "var(--navy)" }}>
          Plans for every nonprofit
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Start free. Upgrade as you grow. All plans include our full funder database and compliance tools.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => (
          <div key={plan.name}
            className="rounded-2xl border p-6 flex flex-col"
            style={{
              background: plan.highlight ? "var(--navy)" : "white",
              borderColor: plan.highlight ? "var(--navy)" : "var(--border)",
              boxShadow: plan.highlight ? "0 8px 40px rgba(13,27,42,0.2)" : undefined,
            }}>
            {plan.highlight && (
              <div className="text-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: "rgba(196,151,74,0.2)", color: "var(--gold)" }}>Most Popular</span>
              </div>
            )}
            <h2 className="font-serif font-bold text-xl" style={{ color: plan.highlight ? "white" : "var(--navy)" }}>{plan.name}</h2>
            <p className="text-xs mt-1 mb-4" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>{plan.desc}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold" style={{ color: plan.highlight ? "var(--gold)" : "var(--navy)" }}>{plan.price}</span>
              <span className="text-sm ml-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>/{plan.period}</span>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: plan.highlight ? "var(--gold)" : "#2EAD6B" }} />
                  <span style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : "var(--text)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href}
              className="block text-center rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={plan.highlight
                ? { background: "var(--gold)", color: "var(--navy)" }
                : { background: "linear-gradient(135deg, var(--navy-light), var(--navy))", color: "white" }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <h2 className="font-serif font-bold text-2xl text-center mb-10" style={{ color: "var(--navy)" }}>Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            { q: "Is there a free trial?", a: "All paid plans include a 14-day free trial. No credit card required." },
            { q: "Can I change plans later?", a: "Yes — upgrade or downgrade any time. Changes take effect immediately." },
            { q: "What counts as an AI generation?", a: "Each time you use AI to write or rewrite a grant section counts as one generation." },
            { q: "Do you work with funders outside BC & Alberta?", a: "Our built-in database focuses on BC and Alberta, but you can create grants for any funder." },
            { q: "Is my data secure?", a: "Yes. All data is encrypted at rest and in transit, hosted on Supabase (AWS Canada Central)." },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
              <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--navy)" }}>{item.q}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} Grant2Fund'n — Built for nonprofits in BC & Alberta
      </div>
    </div>
  );
}
