import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import ComplianceScore from "@/components/compliance/ComplianceScore";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { Plus, AlertCircle, FileText, Calendar } from "lucide-react";
import GrantCardActions from "@/components/grants/GrantCardActions";

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: "rgba(196,151,74,0.1)",   text: "var(--gold)",  label: "Draft" },
  IN_REVIEW: { bg: "rgba(74,124,196,0.1)",   text: "#4A7CC4",      label: "In Review" },
  SUBMITTED: { bg: "rgba(46,173,107,0.1)",   text: "#2EAD6B",      label: "Submitted" },
  AWARDED:   { bg: "rgba(46,173,107,0.15)",  text: "#1A8A55",      label: "Awarded" },
  DECLINED:  { bg: "rgba(220,38,38,0.08)",   text: "#DC2626",      label: "Declined" },
  WITHDRAWN: { bg: "rgba(107,101,120,0.1)",  text: "var(--text-muted)", label: "Withdrawn" },
};

export default async function GrantsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  const grants = await prisma.grant.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      funder: { select: { name: true, province: true, sections: { select: { id: true } } } },
      organization: { select: { name: true } },
      sections: { select: { id: true, isComplete: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <TopNav
        title="Grants"
        subtitle={`${grants.length} application${grants.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/grants/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            <Plus className="h-4 w-4" />
            New Grant
          </Link>
        }
      />

      <div className="p-3 md:p-6">
        {grants.length === 0 ? (
          <div className="animate-fade-in rounded-2xl border p-16 text-center"
            style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--warm-gray)" }}>
              <FileText className="h-7 w-7" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--navy)" }}>No grants yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Start by creating your first grant application
            </p>
            <Link href="/grants/new"
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              <Plus className="h-4 w-4" />
              Create your first grant
            </Link>
          </div>
        ) : (
          <div className="space-y-3 stagger animate-slide-up">
            {grants.map((grant) => {
              const days = daysUntil(grant.deadline);
              const urgent = days != null && days <= 7 && days >= 0;
              const status = STATUS_STYLE[grant.status] ?? STATUS_STYLE.DRAFT;
              const completedSections = grant.sections.filter((s) => s.isComplete).length;
              const totalSections = grant.sections.length;
              const progress = totalSections > 0
                ? Math.round((completedSections / totalSections) * 100)
                : 0;

              return (
                <div key={grant.id} className="grant-card p-5">
                  <div className="flex flex-col gap-3">
                    {/* Title row */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <Link href={`/grants/${grant.id}`}
                            className="font-semibold text-sm hover:underline" style={{ color: "var(--navy)" }}>
                            {grant.title}
                          </Link>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: status.bg, color: status.text }}>
                            {status.label}
                          </span>
                          {urgent && (
                            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#DC2626" }}>
                              <AlertCircle className="h-3.5 w-3.5" />
                              {days === 0 ? "Due today!" : `${days}d left`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {grant.funder.name}
                          <span className="mx-1">·</span>
                          <span className="font-medium" style={{ color: grant.funder.province === "BC" ? "#4A7CC4" : "#DC2626" }}>
                            {grant.funder.province}
                          </span>
                          <span className="mx-1 hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{grant.organization.name}</span>
                        </p>
                      </div>
                      {/* Actions always visible */}
                      <GrantCardActions grantId={grant.id} grantTitle={grant.title} />
                    </div>

                    {/* Progress bar */}
                    {totalSections > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {completedSections}/{totalSections} sections
                          </span>
                          <span className="text-xs font-semibold" style={{ color: progress === 100 ? "#2EAD6B" : "var(--navy)" }}>
                            {progress}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {grant.requestedAmount && (
                        <span className="text-xs font-semibold" style={{ color: "var(--navy)" }}>
                          {formatCurrency(Number(grant.requestedAmount))}
                        </span>
                      )}
                      {grant.deadline && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: urgent ? "#DC2626" : "var(--text-muted)" }}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(grant.deadline)}
                        </span>
                      )}
                      <ComplianceScore score={grant.complianceScore} size="sm" showLabel={false} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
