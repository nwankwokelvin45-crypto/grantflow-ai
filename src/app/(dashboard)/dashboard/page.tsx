import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import ComplianceScore from "@/components/compliance/ComplianceScore";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { calculateNextDeadline, getUrgency, URGENCY_LABEL, URGENCY_COLOR } from "@/lib/deadlines";
import {
  Plus, AlertCircle, Calendar, ArrowRight, Bell,
  FileText, Search, Award, Heart,
} from "lucide-react";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

const QUOTES = [
  { text: "Every grant is a bridge between a vision and a community that needs it.", attr: "— Nonprofit Wisdom" },
  { text: "Behind every funded project are thousands of lives changed forever.", attr: "— Grant2Fund'n" },
  { text: "The strength of BC & Alberta nonprofits is the heart of their communities.", attr: "— Grant2Fund'n" },
  { text: "Funding a nonprofit isn't charity — it's an investment in shared humanity.", attr: "— Nonprofit Wisdom" },
  { text: "Great communities aren't built by accident. They're built by people who applied for the grant.", attr: "— Grant2Fund'n" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (memberships.length === 0) redirect("/organization/new");

  const orgIds = memberships.map((m) => m.organizationId);
  const org = memberships[0].organization;

  const [grants, funders, followUps, memberCount] = await Promise.all([
    prisma.grant.findMany({
      where: { organizationId: { in: orgIds } },
      include: {
        funder: { select: { name: true, province: true } },
        organization: { select: { name: true } },
        _count: { select: { sections: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.funder.findMany({
      where: { isActive: true },
      select: { id: true, name: true, province: true, deadlineType: true, deadlineMonth: true, minGrantAmount: true, maxGrantAmount: true },
    }),
    prisma.grant.findMany({
      where: {
        organizationId: { in: orgIds },
        followUpDate: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, title: true, followUpDate: true, funder: { select: { name: true } } },
      orderBy: { followUpDate: "asc" },
    }),
    prisma.orgMembership.count({ where: { organizationId: { in: orgIds } } }),
  ]);

  const now = new Date();
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const today = now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
  const todayQuote = QUOTES[now.getDate() % QUOTES.length];

  const upcomingDeadlines = funders
    .map((f) => {
      const nextDeadline = calculateNextDeadline(f.deadlineType, f.deadlineMonth);
      const daysLeft = nextDeadline
        ? Math.ceil((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const urgency = getUrgency(daysLeft, f.deadlineType);
      return { ...f, nextDeadline, daysLeft, urgency };
    })
    .filter((f) => f.urgency !== "overdue")
    .sort((a, b) => {
      if (a.urgency === "open" && b.urgency !== "open") return 1;
      if (b.urgency === "open" && a.urgency !== "open") return -1;
      if (a.daysLeft == null) return 1;
      if (b.daysLeft == null) return -1;
      return a.daysLeft - b.daysLeft;
    })
    .slice(0, 5);

  const activeGrants = grants.filter((g) => g.status === "DRAFT" || g.status === "IN_REVIEW");
  const submittedGrants = grants.filter((g) => g.status === "SUBMITTED");
  const awardedGrants = grants.filter((g) => g.status === "AWARDED");
  const totalAwarded = awardedGrants.reduce((sum, g) => sum + (Number(g.requestedAmount) || 0), 0);

  const STATUS: Record<string, { bg: string; text: string; label: string }> = {
    AWARDED:   { bg: "rgba(16,185,129,0.1)",  text: "#059669", label: "Awarded" },
    SUBMITTED: { bg: "rgba(14,165,233,0.1)",  text: "#0284C7", label: "Submitted" },
    DECLINED:  { bg: "rgba(220,38,38,0.08)",  text: "#DC2626", label: "Declined" },
    IN_REVIEW: { bg: "rgba(245,158,11,0.1)",  text: "#D97706", label: "In Review" },
    DRAFT:     { bg: "rgba(107,114,128,0.08)", text: "#6B7280", label: "Draft" },
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <OnboardingModal hasGrants={grants.length > 0} />
      <TopNav
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}`}
        actions={
          <Link
            href="/grants/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}
          >
            <Plus className="h-4 w-4" />
            New Grant
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* ── HERO BANNER ── */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #152C48 100%)", minHeight: "220px" }}
        >
          {/* Community photo — hands together */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=55"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.2, mixBlendMode: "luminosity" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, rgba(13,27,42,0.97) 40%, rgba(13,27,42,0.45) 100%)" }}
          />

          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: "rgba(196,151,74,0.18)", color: "var(--gold)", border: "1px solid rgba(196,151,74,0.35)" }}
              >
                <Heart className="h-3 w-3" fill="currentColor" />
                Empowering BC &amp; Alberta nonprofits
              </div>
              <h1 className="font-serif font-bold text-2xl md:text-3xl text-white mb-1">
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                {today} &nbsp;·&nbsp; {org.name}
              </p>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Active Drafts",  value: activeGrants.length,   color: "#C4974A", bg: "rgba(196,151,74,0.14)",  border: "rgba(196,151,74,0.3)" },
                  { label: "Submitted",       value: submittedGrants.length, color: "#38BDF8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.25)" },
                  { label: "Awarded",         value: awardedGrants.length,   color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.25)" },
                  { label: "Funders in DB",   value: funders.length,         color: "rgba(255,255,255,0.65)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" },
                ].map(({ label, value, color, bg, border }) => (
                  <div
                    key={label}
                    className="rounded-xl px-4 py-2.5 text-center min-w-[80px]"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <p className="text-xl md:text-2xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <Link
                href="/grants/new"
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "var(--gold)", color: "var(--navy)" }}
              >
                <Plus className="h-4 w-4" />
                New Grant
              </Link>
              <Link
                href="/opportunities"
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <Search className="h-4 w-4" />
                Find Funders
              </Link>
            </div>
          </div>
        </div>

        {/* ── FOLLOW-UP REMINDERS ── */}
        {followUps.length > 0 && (
          <div
            className="rounded-xl border p-4"
            style={{ background: "rgba(14,165,233,0.06)", borderColor: "rgba(14,165,233,0.25)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4" style={{ color: "#38BDF8" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                Follow-up Reminders ({followUps.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {followUps.map((g) => {
                const days = Math.ceil((new Date(g.followUpDate!).getTime() - Date.now()) / 86400000);
                const overdue = days < 0;
                return (
                  <Link
                    key={g.id}
                    href={`/grants/${g.id}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:shadow-sm"
                    style={{ background: "white", borderColor: overdue ? "rgba(220,38,38,0.3)" : "rgba(14,165,233,0.3)", color: "var(--navy)" }}
                  >
                    <span className="truncate max-w-[140px]">{g.funder.name}</span>
                    <span className="shrink-0 font-semibold" style={{ color: overdue ? "#DC2626" : "#38BDF8" }}>
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `in ${days}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              href: "/grants/new",
              emoji: "✍️",
              label: "Write a Grant",
              desc: "AI-powered drafting",
              bg: "linear-gradient(135deg, #0D1B2A 0%, #1A3050 100%)",
            },
            {
              href: "/opportunities",
              emoji: "🔍",
              label: "Find Funders",
              desc: `${funders.length}+ BC & AB funders`,
              bg: "linear-gradient(135deg, #B8861E 0%, #C4974A 100%)",
            },
            {
              href: "/team",
              emoji: "🤝",
              label: "Your Team",
              desc: `${memberCount} member${memberCount === 1 ? "" : "s"} collaborating`,
              bg: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
            },
            {
              href: "/analytics",
              emoji: "📊",
              label: "Analytics",
              desc: "Track your impact",
              bg: "linear-gradient(135deg, #047857 0%, #10B981 100%)",
            },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl p-4 flex flex-col gap-3 text-white transition-transform hover:scale-[1.02] hover:shadow-lg"
              style={{ background: a.bg }}
            >
              <span className="text-3xl">{a.emoji}</span>
              <div>
                <p className="font-bold text-sm">{a.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT — grants + inspiration (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Inspiration strip */}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ minHeight: "130px", background: "linear-gradient(135deg, #0D1B2A, #1A3050)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=900&q=55"
                alt="Volunteers working together"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.22 }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, rgba(13,27,42,0.92) 55%, transparent 100%)" }}
              />
              <div className="relative z-10 p-5 flex items-center gap-4">
                <span className="text-4xl shrink-0">💚</span>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: "rgba(196,151,74,0.8)" }}
                  >
                    Today&apos;s Thought
                  </p>
                  <p className="font-serif text-base md:text-lg text-white leading-snug">
                    &ldquo;{todayQuote.text}&rdquo;
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {todayQuote.attr}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent grants */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" style={{ color: "var(--gold)" }} />
                  <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Recent Grants</h2>
                </div>
                <Link
                  href="/grants"
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "var(--gold)" }}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {grants.length === 0 ? (
                <div className="text-center py-14 px-6">
                  <span className="text-5xl block mb-4">✍️</span>
                  <p className="font-serif font-semibold text-lg mb-1.5" style={{ color: "var(--navy)" }}>
                    Write your first grant
                  </p>
                  <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                    Connect with funders and start growing your community impact in BC &amp; Alberta.
                  </p>
                  <Link
                    href="/grants/new"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}
                  >
                    <Plus className="h-4 w-4" />
                    Start a grant application
                  </Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {grants.slice(0, 8).map((grant) => {
                    const days = daysUntil(grant.deadline);
                    const urgent = days != null && days <= 7 && days >= 0;
                    const sc = STATUS[grant.status] ?? STATUS.DRAFT;
                    return (
                      <Link
                        key={grant.id}
                        href={`/grants/${grant.id}`}
                        className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--cream)]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate" style={{ color: "var(--navy)" }}>
                              {grant.title}
                            </p>
                            {urgent && (
                              <span
                                className="flex items-center gap-0.5 text-xs font-bold shrink-0"
                                style={{ color: "#DC2626" }}
                              >
                                <AlertCircle className="h-3 w-3" />
                                {days === 0 ? "Today!" : `${days}d left`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                            {grant.funder.name} · {grant.funder.province}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {grant.requestedAmount && (
                            <span className="hidden sm:block text-xs font-semibold" style={{ color: "var(--navy)" }}>
                              {formatCurrency(Number(grant.requestedAmount))}
                            </span>
                          )}
                          {grant.deadline && (
                            <span className="hidden md:block text-xs" style={{ color: "var(--text-muted)" }}>
                              {formatDate(grant.deadline)}
                            </span>
                          )}
                          <ComplianceScore score={grant.complianceScore} size="sm" showLabel={false} />
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {sc.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — sidebar (1/3) */}
          <div className="space-y-4">

            {/* Community photo card */}
            <div className="relative overflow-hidden rounded-2xl" style={{ height: "200px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=70"
                alt="Community members"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex flex-col justify-end p-4"
                style={{ background: "linear-gradient(to top, rgba(13,27,42,0.88) 0%, transparent 55%)" }}
              >
                <p className="text-white font-semibold text-sm leading-snug">
                  Strong communities start with funded programs.
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Nonprofits in BC &amp; Alberta making a difference
                </p>
              </div>
            </div>

            {/* Awarded total — only if there are awarded grants */}
            {totalAwarded > 0 && (
              <div
                className="rounded-xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, #047857 0%, #059669 100%)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="h-4 w-4 opacity-70" />
                  <p className="text-xs font-bold uppercase tracking-wide opacity-70">Total Awarded</p>
                </div>
                <p className="font-serif font-bold text-3xl">{formatCurrency(totalAwarded)}</p>
                <p className="text-xs mt-1 opacity-60">
                  from {awardedGrants.length} successful application{awardedGrants.length === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {/* Upcoming deadlines */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
              <div
                className="flex items-center justify-between px-4 py-3.5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: "var(--gold)" }} />
                  <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                    Upcoming Deadlines
                  </h2>
                </div>
                <Link href="/opportunities" className="text-xs font-medium" style={{ color: "var(--gold)" }}>
                  All
                </Link>
              </div>

              {upcomingDeadlines.length === 0 ? (
                <p className="p-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  No urgent deadlines right now
                </p>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {upcomingDeadlines.map((f) => {
                    const colors = URGENCY_COLOR[f.urgency];
                    const label = URGENCY_LABEL[f.urgency];
                    const deadlineStr =
                      f.urgency === "open"
                        ? "Open year-round"
                        : f.nextDeadline
                        ? f.nextDeadline.toLocaleDateString("en-CA", { month: "short", day: "numeric" }) +
                          (f.daysLeft != null && f.daysLeft <= 60 ? ` · ${f.daysLeft}d` : "")
                        : "TBD";
                    return (
                      <Link
                        key={f.id}
                        href={`/funders/${f.id}`}
                        className="flex items-start justify-between gap-2 px-4 py-3 hover:bg-[var(--cream)] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "var(--navy)" }}>
                            {f.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: f.province === "BC" ? "rgba(74,124,196,0.1)" : "rgba(220,38,38,0.08)",
                                color: f.province === "BC" ? "#4A7CC4" : "#DC2626",
                              }}
                            >
                              {f.province}
                            </span>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{deadlineStr}</p>
                          </div>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 mt-0.5"
                          style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link
                href="/opportunities"
                className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-t"
                style={{ borderColor: "var(--border)", color: "var(--gold)" }}
              >
                Browse all funders
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Second community photo */}
            <div className="relative overflow-hidden rounded-2xl" style={{ height: "160px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=65"
                alt="Community gathering"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex flex-col justify-end p-4"
                style={{ background: "linear-gradient(to top, rgba(13,27,42,0.85) 0%, transparent 50%)" }}
              >
                <p className="text-white font-semibold text-sm">
                  🏘️ Rooted in community. Funded by purpose.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
