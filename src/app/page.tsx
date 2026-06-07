"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  CheckCircle, Wand2, Shield, ArrowRight, BarChart2, Users, Star,
  ClipboardList, Search, GitBranch, DollarSign, Lock,
  Sun, Moon, Sparkles, Zap, Award,
} from "lucide-react";

const FUNDERS = [
  "Vancouver Foundation", "BC Arts Council", "United Way Lower Mainland",
  "Columbia Basin Trust", "Real Estate Foundation of BC",
  "Alberta Foundation for the Arts", "United Way Alberta Capital Region",
  "The Rozsa Foundation", "Edmonton Community Foundation", "Calgary Foundation",
  "Pacific Salmon Foundation", "Community Foundations of Canada",
];

const TESTIMONIALS = [
  {
    quote: "We secured $140,000 in our first year using Grant2Fund'n. The AI writes proposals that actually sound like us — not a robot.",
    author: "Mia T.",
    role: "Executive Director, Vancouver Youth Society",
    avatar: "MT",
    color: "#4A7CC4",
  },
  {
    quote: "The compliance checker alone is worth it. We stopped missing eligibility requirements that used to cost us applications.",
    author: "Dani R.",
    role: "Development Manager, Alberta Arts Collective",
    avatar: "DR",
    color: "var(--gold)",
  },
  {
    quote: "Finally a platform designed for small nonprofits. We were spending 40 hours per application — now it's under 8.",
    author: "Patrick N.",
    role: "Program Lead, BC Community Health Network",
    avatar: "PN",
    color: "#2EAD6B",
  },
];

const BENTO_FEATURES = [
  {
    icon: Wand2,
    title: "AI Proposal Drafting",
    desc: "Generate tailored, funder-specific narratives that preserve your organization's authentic voice — section by section, in seconds.",
    size: "large",
    color: "#C4974A",
    bg: "rgba(196,151,74,0.08)",
  },
  {
    icon: Search,
    title: "Grant Discovery",
    desc: "AI analyzes your org profile and surfaces the best-matched funders with success likelihood scores.",
    size: "medium",
    color: "#4A7CC4",
    bg: "rgba(74,124,196,0.08)",
  },
  {
    icon: Shield,
    title: "Compliance Checker",
    desc: "Real-time eligibility screening with a 100-point compliance score before you submit.",
    size: "medium",
    color: "#2EAD6B",
    bg: "rgba(46,173,107,0.08)",
  },
  {
    icon: GitBranch,
    title: "Automated Workflows",
    desc: "No-code routing, approvals, and reminders.",
    size: "small",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    icon: BarChart2,
    title: "Advanced Analytics",
    desc: "Conversational AI querying and predictive forecasting.",
    size: "small",
    color: "#E85D04",
    bg: "rgba(232,93,4,0.08)",
  },
  {
    icon: ClipboardList,
    title: "Form Builder",
    desc: "Drag-and-drop multi-step application forms.",
    size: "small",
    color: "#4A7CC4",
    bg: "rgba(74,124,196,0.08)",
  },
  {
    icon: DollarSign,
    title: "Financial Management",
    desc: "Budgeting, disbursements, and expense tracking.",
    size: "small",
    color: "#2EAD6B",
    bg: "rgba(46,173,107,0.08)",
  },
  {
    icon: Lock,
    title: "Audit Trails",
    desc: "Immutable logs, RBAC, and GDPR/SOC 2 compliance.",
    size: "small",
    color: "#C4974A",
    bg: "rgba(196,151,74,0.08)",
  },
];

const STEPS = [
  { num: "01", title: "Build your org profile", desc: "Mission, programs, budget, province — your AI context is set once and used everywhere.", icon: Users },
  { num: "02", title: "Discover matched funders", desc: "AI scores 75+ real BC & Alberta funders against your profile and tells you why you're a match.", icon: Search },
  { num: "03", title: "Write with AI", desc: "Generate section-by-section proposal content tailored to each funder's exact priorities and language.", icon: Wand2 },
  { num: "04", title: "Score, export & submit", desc: "100-point compliance check, PDF/Word export, and a clear checklist of what to attach.", icon: Award },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try everything, no card needed.",
    features: ["3 active grants", "10 AI generations/mo", "75+ funders database", "PDF export"],
    cta: "Get started free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    desc: "For growing nonprofits.",
    features: ["10 active grants", "50 AI generations/mo", "Deadline reminders", "Priority support"],
    cta: "Start free trial",
    href: "/register?plan=STARTER",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    desc: "For serious grant writers.",
    features: ["Unlimited grants", "Unlimited AI", "Version history", "Advanced compliance", "Team collaboration"],
    cta: "Start free trial",
    href: "/register?plan=PRO",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    desc: "For large organizations.",
    features: ["Multi-org support", "Custom branding", "SLA guarantee", "API access", "Dedicated CSM"],
    cta: "Contact us",
    href: "mailto:hello@grant2fundn.ca",
    highlight: false,
  },
];

// ─────────────────────────────────────────────
function NavBar({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navTextColor = isDark ? "rgba(255,255,255,0.6)" : "var(--text-muted)";
  const navTextHover = isDark ? "white" : "var(--navy)";
  const scrolledBg = isDark ? "rgba(13,27,42,0.88)" : "rgba(247,244,239,0.92)";
  const scrolledBorder = isDark ? "rgba(255,255,255,0.07)" : "var(--border)";
  const logoColor = isDark ? "white" : "var(--navy)";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? scrolledBg : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${scrolledBorder}` : "none",
      }}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="Grant2Fund'n" width={34} height={34} className="rounded-xl" />
          <span className="font-serif font-bold text-lg" style={{ color: logoColor }}>Grant2Fund&apos;n</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"]].map(([href, label]) => (
            <a key={label} href={href}
              className="text-sm font-medium transition-colors"
              style={{ color: navTextColor }}
              onMouseEnter={e => (e.currentTarget.style.color = navTextHover)}
              onMouseLeave={e => (e.currentTarget.style.color = navTextColor)}>
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} aria-label="Toggle theme"
            className="h-9 w-9 flex items-center justify-center rounded-xl transition-all"
            style={{ color: navTextColor, background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(13,27,42,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {isDark ? <Sun className="h-4 w-4" style={{ color: "var(--gold)" }} /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/login"
            className="text-sm font-medium transition-colors px-3 py-2 rounded-lg"
            style={{ color: navTextColor }}>
            Sign in
          </Link>
          <Link href="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #C4974A, #A07830)", boxShadow: "0 4px 16px rgba(196,151,74,0.35)" }}>
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
function HeroSection({ isDark }: { isDark: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const bg = isDark ? "#0A1628" : "var(--cream)";
  const headingColor = isDark ? "white" : "var(--navy)";
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "var(--text-muted)";
  const gridColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(13,27,42,0.07)";
  const statBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(13,27,42,0.04)";
  const statBorder = isDark ? "rgba(255,255,255,0.07)" : "var(--border)";
  const statLabel = isDark ? "rgba(255,255,255,0.45)" : "var(--text-muted)";
  const scrollDot = isDark ? "bg-white" : "bg-navy";
  const scrollBorder = isDark ? "rgba(255,255,255,0.3)" : "var(--border)";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden"
      style={{ background: bg, transition: "background 0.4s ease" }}>

      {/* Ambient orbs */}
      <div className="orb absolute rounded-full pointer-events-none"
        style={{ width: 700, height: 700, left: "-15%", top: "-20%", background: "radial-gradient(circle, rgba(196,151,74,0.12) 0%, transparent 65%)", filter: "blur(40px)" }} />
      <div className="orb-2 absolute rounded-full pointer-events-none"
        style={{ width: 600, height: 600, right: "-10%", bottom: "-10%", background: "radial-gradient(circle, rgba(74,124,196,0.1) 0%, transparent 65%)", filter: "blur(40px)" }} />
      <div className="orb-3 absolute rounded-full pointer-events-none"
        style={{ width: 400, height: 400, left: "40%", top: "60%", background: "radial-gradient(circle, rgba(46,173,107,0.07) 0%, transparent 65%)", filter: "blur(30px)" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-8 border"
        style={{
          background: "rgba(196,151,74,0.1)",
          borderColor: "rgba(196,151,74,0.25)",
          color: isDark ? "#E8C27A" : "var(--gold)",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(10px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
        <Sparkles className="h-3 w-3" />
        🇨🇦 Built exclusively for BC &amp; Alberta nonprofits
      </div>

      {/* Headline */}
      <h1
        className="font-serif max-w-5xl mb-6"
        style={{
          fontSize: "clamp(2.6rem, 7vw, 5rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: headingColor,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(16px)",
          transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s, color 0.4s ease",
        }}>
        The grant platform that<br />
        <span className="gradient-text">actually gets you funded</span>
      </h1>

      {/* Subheading */}
      <p
        className="text-base md:text-lg leading-relaxed max-w-2xl mb-10"
        style={{
          color: subColor,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(12px)",
          transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
        }}>
        AI-powered grant writing, workflow automation, compliance scoring, and impact reporting
        — unified for nonprofits in British Columbia and Alberta.
      </p>

      {/* CTAs */}
      <div
        className="flex items-center gap-3 flex-wrap justify-center mb-16"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(10px)",
          transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
        }}>
        <Link href="/register"
          className="group flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:shadow-2xl"
          style={{ background: "linear-gradient(135deg, #C4974A, #A07830)", boxShadow: "0 8px 32px rgba(196,151,74,0.4)" }}>
          <Zap className="h-4 w-4" />
          Start writing for free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <a href="#how-it-works"
          className="flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold transition-all hover:-translate-y-1"
          style={{
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "var(--border)"}`,
            color: isDark ? "rgba(255,255,255,0.75)" : "var(--navy)",
            background: isDark ? "rgba(255,255,255,0.04)" : "white",
          }}>
          See how it works
        </a>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden max-w-xl w-full"
        style={{
          background: statBorder,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(8px)",
          transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
        }}>
        {[
          { value: "75+", label: "Real BC/AB Funders" },
          { value: "20+", label: "Platform Features" },
          { value: "100pt", label: "Max Compliance Score" },
        ].map((s) => (
          <div key={s.label} className="py-5 px-4 text-center" style={{ background: statBg }}>
            <p className="text-xl md:text-2xl font-bold mb-0.5 gradient-text">{s.value}</p>
            <p className="text-xs font-medium" style={{ color: statLabel }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
        <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: scrollBorder }}>
          <div className={`w-1 h-2 rounded-full ${scrollDot}`} style={{ background: isDark ? "white" : "var(--navy)", animation: "slideDown 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function MarqueeSection({ isDark }: { isDark: boolean }) {
  const doubled = [...FUNDERS, ...FUNDERS];
  return (
    <div className="py-5 overflow-hidden border-y" style={{ background: isDark ? "#0D1B2A" : "var(--navy)", borderColor: "rgba(255,255,255,0.07)", transition: "background 0.4s ease" }}>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
        Funder database includes
      </p>
      <div className="flex overflow-hidden">
        <div className="marquee-track flex gap-8 items-center whitespace-nowrap">
          {doubled.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gold)", opacity: 0.5 }} />
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function FeaturesSection({ isDark }: { isDark: boolean }) {
  const sectionBg = isDark ? "#0D1B2A" : "white";
  const headingColor = isDark ? "white" : "var(--navy)";
  const subColor = isDark ? "rgba(255,255,255,0.45)" : "var(--text-muted)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "white";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "var(--border)";
  const cardHoverBorder = "rgba(196,151,74,0.35)";
  const titleColor = isDark ? "white" : "var(--navy)";
  const descColor = isDark ? "rgba(255,255,255,0.4)" : "var(--text-muted)";
  const descColorSm = isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)";

  return (
    <section id="features" className="py-28 px-6" style={{ background: sectionBg, transition: "background 0.4s ease" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.2)", color: isDark ? "#E8C27A" : "var(--gold)" }}>
            <Sparkles className="h-3 w-3" /> Everything you need
          </div>
          <h2 className="font-serif mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: headingColor, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            From discovery to disbursement
          </h2>
          <p className="max-w-xl mx-auto text-base" style={{ color: subColor }}>
            Every tool a BC or Alberta nonprofit needs — in one platform designed to win more grants.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Large card */}
          {(() => {
            const f = BENTO_FEATURES[0];
            const Icon = f.icon;
            return (
              <div key={f.title} className="md:col-span-2 lg:col-span-2 row-span-2 p-8 flex flex-col justify-between min-h-64 rounded-2xl transition-all duration-300"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cardHoverBorder; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 12px 40px rgba(13,27,42,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div>
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: f.bg, border: `1px solid ${f.color}30` }}>
                    <Icon className="h-7 w-7" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: titleColor }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: descColor }}>{f.desc}</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs font-semibold" style={{ color: f.color }}>
                  <span>Included in all plans</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            );
          })()}

          {/* Medium cards */}
          {BENTO_FEATURES.slice(1, 3).map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 flex flex-col gap-4 rounded-2xl transition-all duration-300"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cardHoverBorder; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 12px 40px rgba(13,27,42,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{ background: f.bg, border: `1px solid ${f.color}30` }}>
                  <Icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: titleColor }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: descColor }}>{f.desc}</p>
                </div>
              </div>
            );
          })}

          {/* Small cards */}
          {BENTO_FEATURES.slice(3).map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-5 flex items-start gap-4 rounded-2xl transition-all duration-300"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cardHoverBorder; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = isDark ? "0 12px 40px rgba(0,0,0,0.3)" : "0 8px 24px rgba(13,27,42,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: f.bg, border: `1px solid ${f.color}25` }}>
                  <Icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-xs mb-1" style={{ color: titleColor }}>{f.title}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: descColorSm }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function HowItWorksSection({ isDark }: { isDark: boolean }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const sectionBg = isDark ? "#080F1C" : "var(--cream)";
  const headingColor = isDark ? "white" : "var(--navy)";
  const subColor = isDark ? "rgba(255,255,255,0.4)" : "var(--text-muted)";
  const lineColor = isDark ? "rgba(255,255,255,0.06)" : "var(--border)";
  const cardInactiveBg = isDark ? "rgba(255,255,255,0.025)" : "white";
  const cardInactiveBorder = isDark ? "rgba(255,255,255,0.06)" : "var(--border)";
  const iconInactiveBg = isDark ? "rgba(255,255,255,0.06)" : "var(--warm-gray)";
  const iconInactiveColor = isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)";
  const numInactiveColor = isDark ? "rgba(255,255,255,0.2)" : "var(--border)";
  const titleColor = isDark ? "white" : "var(--navy)";
  const descColor = isDark ? "rgba(255,255,255,0.4)" : "var(--text-muted)";

  return (
    <section id="how-it-works" className="py-28 px-6" style={{ background: sectionBg, transition: "background 0.4s ease" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(74,124,196,0.1)", borderColor: "rgba(74,124,196,0.25)", color: isDark ? "#7AABF0" : "#4A7CC4" }}>
            Simple Process
          </div>
          <h2 className="font-serif mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: headingColor, letterSpacing: "-0.02em" }}>
            Up and running in minutes
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: subColor }}>
            Sign up, set your profile once, and start generating fundable proposals the same day.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 relative">
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px" style={{ background: lineColor }} />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = activeStep === i;
            return (
              <div key={step.num}
                onMouseEnter={() => setActiveStep(i)}
                className="relative rounded-2xl p-6 transition-all duration-500 cursor-default"
                style={{
                  background: isActive ? "rgba(196,151,74,0.08)" : cardInactiveBg,
                  border: `1px solid ${isActive ? "rgba(196,151,74,0.3)" : cardInactiveBorder}`,
                  boxShadow: isActive ? "0 16px 48px rgba(196,151,74,0.1)" : "none",
                  transform: isActive ? "translateY(-6px)" : "none",
                }}>
                <div className="relative mx-auto mb-5 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #C4974A, #A07830)" : iconInactiveBg,
                    boxShadow: isActive ? "0 8px 24px rgba(196,151,74,0.35)" : "none",
                  }}>
                  <Icon className="h-5 w-5" style={{ color: isActive ? "white" : iconInactiveColor }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: isActive ? "var(--gold)" : numInactiveColor }}>
                    {step.num}
                  </p>
                  <h3 className="font-bold text-sm mb-2" style={{ color: titleColor }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: descColor }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-28 px-6" style={{ background: "var(--cream)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.25)", color: "var(--gold)" }}>
            <Star className="h-3 w-3" fill="currentColor" /> Trusted by nonprofits
          </div>
          <h2 className="font-serif mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--navy)", letterSpacing: "-0.02em" }}>
            Real results from real orgs
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.author}
              className="rounded-2xl p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1.5 cursor-default"
              style={{ background: "white", border: "1.5px solid var(--border)", boxShadow: "0 4px 24px rgba(13,27,42,0.05)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + "50"; e.currentTarget.style.boxShadow = `0 12px 40px ${t.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(13,27,42,0.05)"; }}>
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5" fill="var(--gold)" style={{ color: "var(--gold)" }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text)", fontStyle: "italic" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--navy)" }}>{t.author}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function PricingSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="pricing" className="py-28 px-6" style={{ background: "#0D1B2A" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.2)", color: "#E8C27A" }}>
            Pricing
          </div>
          <h2 className="font-serif mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "white", letterSpacing: "-0.02em" }}>
            Plans for every nonprofit
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Start free. Upgrade when you&apos;re ready. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isHov = hovered === plan.name;
            return (
              <div key={plan.name}
                onMouseEnter={() => setHovered(plan.name)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-2xl p-6 flex flex-col transition-all duration-300 cursor-default relative overflow-hidden"
                style={{
                  background: plan.highlight
                    ? "linear-gradient(160deg, rgba(196,151,74,0.15) 0%, rgba(196,151,74,0.05) 100%)"
                    : "rgba(255,255,255,0.03)",
                  border: plan.highlight
                    ? "1.5px solid rgba(196,151,74,0.45)"
                    : `1px solid ${isHov ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: plan.highlight
                    ? "0 20px 60px rgba(196,151,74,0.15), inset 0 1px 0 rgba(196,151,74,0.2)"
                    : isHov ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
                  transform: plan.highlight ? "scale(1.02)" : isHov ? "translateY(-4px)" : "none",
                }}>
                {plan.highlight && (
                  <div className="absolute top-0 right-0 rounded-bl-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: "linear-gradient(135deg, #C4974A, #A07830)", color: "white" }}>
                    Most Popular
                  </div>
                )}
                <p className="font-bold text-white mb-1 text-base">{plan.name}</p>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold" style={{ color: plan.highlight ? "#E8C27A" : "white" }}>{plan.price}</span>
                  <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: plan.highlight ? "#C4974A" : "#2EAD6B" }} />
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}
                  className="block text-center rounded-xl py-2.5 text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={plan.highlight
                    ? { background: "linear-gradient(135deg, #C4974A, #A07830)", color: "white", boxShadow: "0 8px 24px rgba(196,151,74,0.3)" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.25)" }}>
          All plans include a 14-day free trial on paid tiers · No credit card required to start
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="relative py-28 px-6 text-center overflow-hidden" style={{ background: "#080F1C" }}>
      <div className="orb absolute rounded-full pointer-events-none"
        style={{ width: 500, height: 500, left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(196,151,74,0.1) 0%, transparent 65%)", filter: "blur(40px)" }} />

      <div className="relative max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-8 border"
          style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.2)", color: "#E8C27A" }}>
          <Users className="h-3 w-3" /> Join nonprofits across BC &amp; Alberta
        </div>
        <h2 className="font-serif font-bold text-white mb-5"
          style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          Ready to write grants that <span className="gradient-text">actually win?</span>
        </h2>
        <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.45)" }}>
          Free to start. No credit card required. Start writing your first proposal in under 5 minutes.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register"
            className="group flex items-center gap-2 rounded-xl px-9 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1"
            style={{ background: "linear-gradient(135deg, #C4974A, #A07830)", boxShadow: "0 12px 40px rgba(196,151,74,0.4)" }}>
            <Zap className="h-4 w-4" />
            Create free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#pricing"
            className="rounded-xl px-9 py-4 text-sm font-semibold transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            View all plans
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
export default function HomePage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") { document.documentElement.setAttribute("data-theme", "dark"); setIsDark(true); }
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen">
      <NavBar isDark={isDark} toggleTheme={toggleTheme} />
      <HeroSection isDark={isDark} />
      <MarqueeSection isDark={isDark} />
      <FeaturesSection isDark={isDark} />
      <HowItWorksSection isDark={isDark} />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <footer className="py-10 border-t" style={{ background: "#080F1C", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="Grant2Fund'n" width={28} height={28} className="rounded-lg opacity-70" />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Grant2Fund&apos;n</span>
          </div>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Grant2Fund&apos;n — Built for nonprofits in British Columbia &amp; Alberta
          </p>
          <div className="flex items-center gap-5">
            {[["#features","Features"],["#pricing","Pricing"],["/login","Sign in"]].map(([href, label]) => (
              <a key={label} href={href} className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
