"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  CheckCircle, Wand2, Shield, ArrowRight, BarChart2, Users, Star,
  ClipboardList, Search, GitBranch, DollarSign, Lock,
  Sun, Moon, Sparkles, Zap, Award, Heart, Quote,
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
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
  },
  {
    quote: "The compliance checker alone is worth it. We stopped missing eligibility requirements that used to cost us applications.",
    author: "Dani R.",
    role: "Development Manager, Alberta Arts Collective",
    avatar: "DR",
    color: "var(--gold)",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&q=80",
  },
  {
    quote: "Finally a platform designed for small nonprofits. We were spending 40 hours per application — now it's under 8.",
    author: "Patrick N.",
    role: "Program Lead, BC Community Health Network",
    avatar: "PN",
    color: "#2EAD6B",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
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
    features: ["3 active grants", "25 AI generations/mo", "75+ funders database", "PDF export"],
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

const COMMUNITY_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=75",
    caption: "Youth programs in Vancouver",
    tag: "BC",
  },
  {
    src: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=600&q=75",
    caption: "Community partnerships that last",
    tag: "BC & AB",
  },
  {
    src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=75",
    caption: "Every child deserves support",
    tag: "Alberta",
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
  const tc = isDark ? "rgba(255,255,255,0.6)" : "var(--text-muted)";
  const th = isDark ? "white" : "var(--navy)";
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? (isDark ? "rgba(13,27,42,0.92)" : "rgba(247,244,239,0.94)") : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "var(--border)"}` : "none",
      }}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="Grant2Fund'n" width={34} height={34} className="rounded-xl" />
          <span className="font-serif font-bold text-lg" style={{ color: isDark ? "white" : "var(--navy)" }}>Grant2Fund&apos;n</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[["#features", "Features"], ["#how-it-works", "How it works"], ["#community", "Community"], ["#pricing", "Pricing"]].map(([href, label]) => (
            <a key={label} href={href} className="text-sm font-medium transition-colors" style={{ color: tc }}
              onMouseEnter={e => (e.currentTarget.style.color = th)}
              onMouseLeave={e => (e.currentTarget.style.color = tc)}>{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} aria-label="Toggle theme"
            className="h-9 w-9 flex items-center justify-center rounded-xl transition-all" style={{ color: tc }}>
            {isDark ? <Sun className="h-4 w-4" style={{ color: "var(--gold)" }} /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/login" className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: tc }}>Sign in</Link>
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
  const hc = isDark ? "white" : "var(--navy)";
  const sc = isDark ? "rgba(255,255,255,0.55)" : "var(--text-muted)";
  const statBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(13,27,42,0.04)";
  const statBorder = isDark ? "rgba(255,255,255,0.07)" : "var(--border)";

  const heroPhotos = [
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=75",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=75",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=75",
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=400&q=75",
  ];

  return (
    <section className="relative min-h-screen flex items-center px-6 pt-24 pb-20 overflow-hidden"
      style={{ background: bg, transition: "background 0.4s ease" }}>

      {/* Ambient orbs */}
      <div className="orb absolute rounded-full pointer-events-none"
        style={{ width: 700, height: 700, left: "-15%", top: "-20%", background: "radial-gradient(circle, rgba(196,151,74,0.12) 0%, transparent 65%)", filter: "blur(40px)" }} />
      <div className="orb-2 absolute rounded-full pointer-events-none"
        style={{ width: 500, height: 500, right: "5%", bottom: "-10%", background: "radial-gradient(circle, rgba(74,124,196,0.08) 0%, transparent 65%)", filter: "blur(40px)" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.03)" : "rgba(13,27,42,0.04)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(13,27,42,0.04)"} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT — copy */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-8 border"
            style={{ background: "rgba(196,151,74,0.1)", borderColor: "rgba(196,151,74,0.25)", color: isDark ? "#E8C27A" : "var(--gold)" }}>
            <Sparkles className="h-3 w-3" />
            🇨🇦 Built exclusively for BC &amp; Alberta nonprofits
          </div>

          <h1 className="font-serif mb-6"
            style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.8rem)", lineHeight: 1.06, letterSpacing: "-0.03em", color: hc }}>
            The grant platform that<br />
            <span className="gradient-text">actually gets you funded</span>
          </h1>

          <p className="text-base md:text-lg leading-relaxed mb-10 max-w-xl" style={{ color: sc }}>
            AI-powered grant writing, workflow automation, compliance scoring, and impact reporting
            — unified for nonprofits in British Columbia and Alberta.
          </p>

          <div className="flex items-center gap-3 flex-wrap mb-12">
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

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden max-w-md"
            style={{ background: statBorder }}>
            {[
              { value: "75+", label: "Real BC/AB Funders" },
              { value: "20+", label: "Platform Features" },
              { value: "100pt", label: "Compliance Score" },
            ].map((s) => (
              <div key={s.label} className="py-4 px-4 text-center" style={{ background: statBg }}>
                <p className="text-xl font-bold mb-0.5 gradient-text">{s.value}</p>
                <p className="text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — community photo mosaic */}
        <div
          className="hidden lg:grid grid-cols-2 gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateX(20px)",
            transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
          }}
        >
          {/* Large top-left photo */}
          <div className="relative overflow-hidden rounded-2xl row-span-2" style={{ height: "380px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPhotos[0]} alt="Community volunteers" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,42,0.7) 0%, transparent 50%)" }} />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: "rgba(196,151,74,0.9)", color: "#0D1B2A" }}>
                <Heart className="h-2.5 w-2.5" fill="currentColor" /> Volunteers
              </div>
            </div>
          </div>

          {/* Top-right photo */}
          <div className="relative overflow-hidden rounded-2xl" style={{ height: "185px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPhotos[1]} alt="Team meeting" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(13,27,42,0.2)" }} />
          </div>

          {/* Bottom-right — two stacked small */}
          <div className="grid grid-rows-2 gap-3">
            <div className="relative overflow-hidden rounded-2xl" style={{ height: "87px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroPhotos[2]} alt="Community youth" className="w-full h-full object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-2xl flex items-center justify-center p-4"
              style={{ height: "87px", background: "linear-gradient(135deg, #0D1B2A, #1A3050)" }}>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>$2.4M+</p>
                <p className="text-xs text-white/50 mt-0.5">in funded grants</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
        <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.3)" : "var(--border)" }}>
          <div className="w-1 h-2 rounded-full" style={{ background: isDark ? "white" : "var(--navy)", animation: "slideDown 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function MarqueeSection({ isDark }: { isDark: boolean }) {
  const doubled = [...FUNDERS, ...FUNDERS];
  return (
    <div className="py-5 overflow-hidden border-y"
      style={{ background: isDark ? "#0D1B2A" : "var(--navy)", borderColor: "rgba(255,255,255,0.07)" }}>
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
  const hc = isDark ? "white" : "var(--navy)";
  const sc = isDark ? "rgba(255,255,255,0.45)" : "var(--text-muted)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "white";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "var(--border)";
  const hoverBorder = "rgba(196,151,74,0.35)";
  const tc = isDark ? "white" : "var(--navy)";
  const dc = isDark ? "rgba(255,255,255,0.4)" : "var(--text-muted)";

  return (
    <section id="features" className="py-28 px-6" style={{ background: sectionBg, transition: "background 0.4s ease" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.2)", color: isDark ? "#E8C27A" : "var(--gold)" }}>
            <Sparkles className="h-3 w-3" /> Everything you need
          </div>
          <h2 className="font-serif mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: hc, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            From discovery to disbursement
          </h2>
          <p className="max-w-xl mx-auto text-base" style={{ color: sc }}>
            Every tool a BC or Alberta nonprofit needs — in one platform designed to win more grants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(() => {
            const f = BENTO_FEATURES[0];
            const Icon = f.icon;
            return (
              <div key={f.title} className="md:col-span-2 lg:col-span-2 row-span-2 p-8 flex flex-col justify-between min-h-64 rounded-2xl transition-all duration-300"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 12px 40px rgba(13,27,42,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div>
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: f.bg, border: `1px solid ${f.color}30` }}>
                    <Icon className="h-7 w-7" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: tc }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: dc }}>{f.desc}</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs font-semibold" style={{ color: f.color }}>
                  <span>Included in all plans</span><ArrowRight className="h-3 w-3" />
                </div>
              </div>
            );
          })()}

          {BENTO_FEATURES.slice(1, 3).map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 flex flex-col gap-4 rounded-2xl transition-all duration-300"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 12px 40px rgba(13,27,42,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{ background: f.bg, border: `1px solid ${f.color}30` }}>
                  <Icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: tc }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: dc }}>{f.desc}</p>
                </div>
              </div>
            );
          })}

          {BENTO_FEATURES.slice(3).map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-5 flex items-start gap-4 rounded-2xl transition-all duration-300"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = isDark ? "0 12px 40px rgba(0,0,0,0.3)" : "0 8px 24px rgba(13,27,42,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: f.bg, border: `1px solid ${f.color}25` }}>
                  <Icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-xs mb-1" style={{ color: tc }}>{f.title}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)" }}>{f.desc}</p>
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
  const hc = isDark ? "white" : "var(--navy)";
  const sc = isDark ? "rgba(255,255,255,0.4)" : "var(--text-muted)";

  return (
    <section id="how-it-works" className="py-28 px-6" style={{ background: sectionBg, transition: "background 0.4s ease" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(74,124,196,0.1)", borderColor: "rgba(74,124,196,0.25)", color: isDark ? "#7AABF0" : "#4A7CC4" }}>
            Simple Process
          </div>
          <h2 className="font-serif mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: hc, letterSpacing: "-0.02em" }}>
            Up and running in minutes
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: sc }}>
            Sign up, set your profile once, and start generating fundable proposals the same day.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 relative">
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "var(--border)" }} />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = activeStep === i;
            return (
              <div key={step.num} onMouseEnter={() => setActiveStep(i)}
                className="relative rounded-2xl p-6 transition-all duration-500 cursor-default"
                style={{
                  background: isActive ? "rgba(196,151,74,0.08)" : isDark ? "rgba(255,255,255,0.025)" : "white",
                  border: `1px solid ${isActive ? "rgba(196,151,74,0.3)" : isDark ? "rgba(255,255,255,0.06)" : "var(--border)"}`,
                  boxShadow: isActive ? "0 16px 48px rgba(196,151,74,0.1)" : "none",
                  transform: isActive ? "translateY(-6px)" : "none",
                }}>
                <div className="relative mx-auto mb-5 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #C4974A, #A07830)" : isDark ? "rgba(255,255,255,0.06)" : "var(--warm-gray)",
                    boxShadow: isActive ? "0 8px 24px rgba(196,151,74,0.35)" : "none",
                  }}>
                  <Icon className="h-5 w-5" style={{ color: isActive ? "white" : isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)" }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: isActive ? "var(--gold)" : isDark ? "rgba(255,255,255,0.2)" : "var(--border)" }}>
                    {step.num}
                  </p>
                  <h3 className="font-bold text-sm mb-2" style={{ color: hc }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: sc }}>{step.desc}</p>
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
function CommunitySection() {
  return (
    <section id="community" className="py-24 px-6 overflow-hidden" style={{ background: "#0D1B2A" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border"
            style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.25)", color: "#E8C27A" }}>
            <Heart className="h-3 w-3" fill="currentColor" /> Real communities. Real impact.
          </div>
          <h2 className="font-serif font-bold text-white mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.02em" }}>
            The people behind the proposals
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every grant application represents real families, children, elders, and communities
            across British Columbia and Alberta.
          </p>
        </div>

        {/* 3-column photo grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {COMMUNITY_PHOTOS.map((p) => (
            <div key={p.caption} className="relative overflow-hidden rounded-2xl group" style={{ height: "320px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 transition-opacity duration-300"
                style={{ background: "linear-gradient(to top, rgba(13,27,42,0.85) 0%, rgba(13,27,42,0.1) 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2"
                  style={{ background: "rgba(196,151,74,0.9)", color: "#0D1B2A" }}>{p.tag}</span>
                <p className="text-white font-semibold text-sm">{p.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Full-width impact strip */}
        <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: "220px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=65"
            alt="Community impact"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.35 }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,27,42,0.95) 30%, rgba(196,151,74,0.15) 100%)" }} />
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <Quote className="h-8 w-8 mb-4" style={{ color: "rgba(196,151,74,0.6)" }} />
              <p className="font-serif text-xl md:text-2xl text-white leading-snug max-w-xl">
                &ldquo;Nonprofits in BC &amp; Alberta distribute over{" "}
                <span style={{ color: "var(--gold)" }}>$1.2 billion</span> in community services every year.
                Grant2Fund&apos;n exists to help more of that money reach the people who need it.&rdquo;
              </p>
              <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>— Grant2Fund&apos;n Mission</p>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {[
                { value: "75+", label: "Funders in database" },
                { value: "BC & AB", label: "Provinces covered" },
                { value: "100pt", label: "Compliance score" },
                { value: "14 day", label: "Free trial" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xl font-bold" style={{ color: "var(--gold)" }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
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
          <h2 className="font-serif mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--navy)", letterSpacing: "-0.02em" }}>
            Real results from real orgs
          </h2>
          <p style={{ color: "var(--text-muted)" }}>Stories from nonprofits making a difference in their communities.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.author}
              className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 cursor-default"
              style={{ background: "white", border: "1.5px solid var(--border)", boxShadow: "0 4px 24px rgba(13,27,42,0.05)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + "50"; e.currentTarget.style.boxShadow = `0 12px 40px ${t.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(13,27,42,0.05)"; }}>
              {/* Photo banner */}
              <div className="relative h-24 overflow-hidden" style={{ background: t.color + "15" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.photo}
                  alt={t.author}
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.3 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${t.color}20, ${t.color}05)` }} />
                {/* Floating avatar */}
                <div className="absolute -bottom-5 left-6 h-11 w-11 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold text-white shadow-md"
                  style={{ background: t.color }}>
                  {t.avatar}
                </div>
              </div>

              <div className="p-6 pt-8 flex flex-col gap-4 flex-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5" fill="var(--gold)" style={{ color: "var(--gold)" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text)", fontStyle: "italic" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
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
          <h2 className="font-serif mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "white", letterSpacing: "-0.02em" }}>
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
                  background: plan.highlight ? "linear-gradient(160deg, rgba(196,151,74,0.15) 0%, rgba(196,151,74,0.05) 100%)" : "rgba(255,255,255,0.03)",
                  border: plan.highlight ? "1.5px solid rgba(196,151,74,0.45)" : `1px solid ${isHov ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: plan.highlight ? "0 20px 60px rgba(196,151,74,0.15), inset 0 1px 0 rgba(196,151,74,0.2)" : isHov ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
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
      {/* Full-bleed community photo bg */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=50"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.12 }}
      />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(196,151,74,0.08) 0%, transparent 65%)" }} />

      <div className="relative max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-8 border"
          style={{ background: "rgba(196,151,74,0.08)", borderColor: "rgba(196,151,74,0.2)", color: "#E8C27A" }}>
          <Users className="h-3 w-3" /> Join nonprofits across BC &amp; Alberta
        </div>
        <h2 className="font-serif font-bold text-white mb-5"
          style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          Ready to write grants that{" "}
          <span className="gradient-text">actually win?</span>
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
      <CommunitySection />
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
            {[["#features", "Features"], ["#community", "Community"], ["#pricing", "Pricing"], ["/login", "Sign in"]].map(([href, label]) => (
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
