import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import ComplianceScore from "@/components/compliance/ComplianceScore";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { calculateNextDeadline, getUrgency, URGENCY_LABEL, URGENCY_COLOR } from "@/lib/deadlines";
import { Plus, AlertCircle, Calendar, ArrowRight, Bell } from "lucide-react";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (memberships.length === 0) {
    redirect("/organization/new");
  }

  const orgIds = memberships.map((m) => m.organizationId);

  const [grants, funders, followUps] = await Promise.all([
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
  ]);

  const now = new Date();
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
    .slice(0, 4);

  const activeGrants = grants.filter((g) => g.status === "DRAFT" || g.status === "IN_REVIEW");
  const submittedGrants = grants.filter((g) => g.status === "SUBMITTED");
  const awardedGrants = grants.filter((g) => g.status === "AWARDED");

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <OnboardingModal hasGrants={grants.length > 0} />
      <TopNav
        title="Dashboard"
        subtitle={`Welcome back, ${session.user.name?.split(" ")[0] ?? "there"}`}
        actions={
          <Link href="/grants/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            <Plus className="h-4 w-4" />
            New Grant
          </Link>
        }
      />

      <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 stagger animate-slide-up">
          {[
            { label: "Active Drafts", value: activeGrants.length, color: "var(--navy)" },
            { label: "Submitted", value: submittedGrants.length, color: "var(--navy)" },
            { label: "Awarded", value: awardedGrants.length, color: "var(--gold)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border p-3 md:p-5" style={{ background: "white", borderColor: "var(--border)" }}>
              <p className="text-xs md:text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="text-2xl md:text-3xl font-bold mt-1" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Follow-up reminders banner */}
        {followUps.length > 0 && (
          <div className="rounded-xl border p-4" style={{ background: "rgba(196,151,74,0.06)", borderColor: "rgba(196,151,74,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                Follow-up Reminders ({followUps.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {followUps.map((g) => {
                const days = Math.ceil((new Date(g.followUpDate!).getTime() - Date.now()) / 86400000);
                const overdue = days < 0;
                return (
                  <Link key={g.id} href={`/grants/${g.id}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:shadow-sm"
                    style={{ background: "white", borderColor: overdue ? "rgba(220,38,38,0.3)" : "rgba(196,151,74,0.3)", color: "var(--navy)" }}>
                    <span className="truncate max-w-[140px]">{g.funder.name}</span>
                    <span className="shrink-0 font-semibold" style={{ color: overdue ? "#DC2626" : "var(--gold)" }}>
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `in ${days}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Grants list */}
          <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Recent Grants</h2>
              <Link href="/grants" className="text-sm font-medium" style={{ color: "var(--gold)" }}>View all</Link>
            </div>

            {grants.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>No grants yet</p>
                <Link href="/grants/new"
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
                  <Plus className="h-4 w-4" />
                  Start your first grant
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {grants.map((grant) => {
                  const days = daysUntil(grant.deadline);
                  const urgent = days != null && days <= 7 && days >= 0;
                  return (
                    <Link key={grant.id} href={`/grants/${grant.id}`}
                      className="flex items-start gap-3 px-4 md:px-6 py-3.5 transition-colors hover:bg-[var(--cream)]">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-medium text-sm truncate" style={{ color: "var(--navy)" }}>{grant.title}</p>
                          {urgent && (
                            <span className="flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: "#DC2626" }}>
                              <AlertCircle className="h-3 w-3" />
                              {days === 0 ? "Today" : `${days}d`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                          {grant.funder.name} · {grant.funder.province}
                        </p>
                        {/* Mobile: show deadline + status inline */}
                        <div className="flex items-center gap-2 mt-1 sm:hidden">
                          {grant.deadline && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(grant.deadline)}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                            ${grant.status === "AWARDED" ? "bg-emerald-100 text-emerald-700" :
                              grant.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                              grant.status === "DECLINED" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-600"}`}>
                            {grant.status.toLowerCase().replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {/* Desktop-only right column */}
                      <div className="hidden sm:flex items-center gap-3 text-sm shrink-0" style={{ color: "var(--text-muted)" }}>
                        {grant.requestedAmount && (
                          <span className="font-medium text-xs" style={{ color: "var(--navy)" }}>
                            {formatCurrency(Number(grant.requestedAmount))}
                          </span>
                        )}
                        {grant.deadline && <span className="text-xs">{formatDate(grant.deadline)}</span>}
                        <ComplianceScore score={grant.complianceScore} size="sm" showLabel={false} />
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${grant.status === "AWARDED" ? "bg-emerald-100 text-emerald-700" :
                            grant.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                            grant.status === "DECLINED" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"}`}>
                          {grant.status.toLowerCase().replace("_", " ")}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming deadlines widget */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: "var(--gold)" }} />
                <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Upcoming Deadlines</h2>
              </div>
              <Link href="/opportunities" className="text-xs font-medium" style={{ color: "var(--gold)" }}>View all</Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No upcoming deadlines</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {upcomingDeadlines.map((f) => {
                  const colors = URGENCY_COLOR[f.urgency];
                  const label = URGENCY_LABEL[f.urgency];
                  const deadlineStr = f.urgency === "open"
                    ? "Open year-round"
                    : f.nextDeadline
                      ? f.nextDeadline.toLocaleDateString("en-CA", { month: "short", day: "numeric" }) +
                        (f.daysLeft != null && f.daysLeft <= 60 ? ` · ${f.daysLeft}d` : "")
                      : "TBD";

                  return (
                    <Link key={f.id} href={`/funders/${f.id}`}
                      className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--cream)]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{f.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: f.province === "BC" ? "rgba(74,124,196,0.1)" : "rgba(220,38,38,0.08)", color: f.province === "BC" ? "#4A7CC4" : "#DC2626" }}>
                            {f.province}
                          </span>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{deadlineStr}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 mt-0.5"
                        style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Link href="/opportunities"
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--gold)" }}>
                View all opportunities
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
