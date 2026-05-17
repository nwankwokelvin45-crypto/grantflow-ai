import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import ComplianceScore from "@/components/compliance/ComplianceScore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Download, CheckCircle, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import SubmitSection from "@/components/grants/SubmitSection";
import DuplicateButton from "@/components/grants/DuplicateButton";
import DeleteGrantButton from "@/components/grants/DeleteGrantButton";

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: "rgba(196,151,74,0.1)",  text: "var(--gold)",  label: "Draft" },
  IN_REVIEW: { bg: "rgba(74,124,196,0.1)",  text: "#4A7CC4",      label: "In Review" },
  SUBMITTED: { bg: "rgba(46,173,107,0.1)",  text: "#2EAD6B",      label: "Submitted" },
  AWARDED:   { bg: "rgba(46,173,107,0.15)", text: "#1A8A55",      label: "Awarded" },
  DECLINED:  { bg: "rgba(220,38,38,0.08)",  text: "#DC2626",      label: "Declined" },
  WITHDRAWN: { bg: "rgba(107,101,120,0.1)", text: "var(--text-muted)", label: "Withdrawn" },
};

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ grantId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { grantId } = await params;

  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    include: {
      organization: true,
      funder: {
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      },
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!grant) notFound();

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: grant.organizationId } },
  });
  if (!membership) redirect("/dashboard");

  const completedSections = grant.sections.filter((s) => s.isComplete).length;
  const totalSections = grant.sections.length;
  const totalWords = grant.sections.reduce((sum, s) => sum + s.wordCount, 0);
  const progress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  const status = STATUS_STYLE[grant.status] ?? STATUS_STYLE.DRAFT;

  return (
    <div className="animate-fade-in">
      <TopNav
        title={grant.title}
        subtitle={`${grant.funder.name} · ${grant.organization.name}`}
        actions={
          <div className="flex items-center gap-1.5">
            {/* Export buttons — hidden on mobile to save space */}
            <div className="hidden sm:flex items-center gap-1">
              {["txt", "pdf", "docx"].map((fmt) => (
                <a key={fmt} href={`/api/grants/${grantId}/export?format=${fmt}`}
                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <Download className="h-3 w-3" />
                  {fmt.toUpperCase()}
                </a>
              ))}
              <DuplicateButton grantId={grantId} />
            </div>
            <DeleteGrantButton grantId={grantId} grantTitle={grant.title} redirectAfter="/grants" variant="icon" />
            <Link href={`/grants/${grantId}/write`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Write</span>
            </Link>
          </div>
        }
      />

      <div className="p-3 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Main */}
          <div className="lg:col-span-2 space-y-4">

            {/* Progress overview */}
            <div className="rounded-xl border p-5 animate-slide-up" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Application Progress</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: progress === 100 ? "#2EAD6B" : "var(--gold)" }}>
                    {progress}%
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: status.bg, color: status.text }}>
                    {status.label}
                  </span>
                </div>
              </div>
              <div className="progress-bar mb-5">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="space-y-2">
                {grant.sections.map((section, i) => {
                  const funderSection = grant.funder.sections.find((s) => s.sectionKey === section.sectionKey);
                  const overLimit = funderSection?.maxWords && section.wordCount > funderSection.maxWords;
                  return (
                    <div key={section.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                      style={{
                        background: section.isComplete ? "rgba(46,173,107,0.05)" : i % 2 === 0 ? "var(--cream)" : "white",
                        animationDelay: `${i * 40}ms`,
                      }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        {section.isComplete ? (
                          <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "#2EAD6B" }} />
                        ) : (
                          <div className="h-4 w-4 shrink-0 rounded-full border-2" style={{ borderColor: "var(--border)" }} />
                        )}
                        <span className="text-sm truncate" style={{ color: "var(--navy)" }}>{section.label}</span>
                        {section.aiGenerated && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                            style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED" }}>AI</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        {overLimit ? (
                          <span className="flex items-center gap-1 font-semibold" style={{ color: "#DC2626" }}>
                            <AlertTriangle className="h-3 w-3" />
                            {section.wordCount}/{funderSection?.maxWords}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            {section.wordCount}{funderSection?.maxWords ? `/${funderSection.maxWords}` : ""} words
                          </span>
                        )}
                        <Link href={`/grants/${grantId}/write`}
                          className="font-semibold" style={{ color: "var(--gold)" }}>
                          Edit
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {grant.sections.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No sections yet.</p>
                    <Link href={`/grants/${grantId}/write`}
                      className="text-sm font-semibold mt-1 block" style={{ color: "var(--gold)" }}>
                      Start writing →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Compliance */}
            <div className="rounded-xl border p-5 text-center animate-slide-up"
              style={{ background: "white", borderColor: "var(--border)", animationDelay: "60ms" }}>
              <h3 className="font-semibold mb-4" style={{ color: "var(--navy)" }}>Compliance Score</h3>
              <ComplianceScore score={grant.complianceScore} size="lg" />
              {grant.lastScoredAt && (
                <p className="text-xs mt-3 flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Clock className="h-3 w-3" />
                  Last checked {formatDate(grant.lastScoredAt)}
                </p>
              )}
              <Link href={`/grants/${grantId}/write`}
                className="mt-4 block text-center text-sm font-semibold" style={{ color: "var(--gold)" }}>
                Run compliance check →
              </Link>
            </div>

            {/* Details */}
            <div className="rounded-xl border p-5 animate-slide-up"
              style={{ background: "white", borderColor: "var(--border)", animationDelay: "120ms" }}>
              <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Details</h3>
              <dl className="space-y-2.5 text-sm">
                {[
                  { label: "Funder", value: grant.funder.name },
                  { label: "Province", value: grant.funder.province },
                  grant.requestedAmount
                    ? { label: "Requesting", value: formatCurrency(Number(grant.requestedAmount)) }
                    : null,
                  grant.deadline
                    ? { label: "Deadline", value: formatDate(grant.deadline) }
                    : null,
                  { label: "Total words", value: totalWords.toLocaleString() },
                ].filter(Boolean).map((item) => (
                  <div key={item!.label} className="flex justify-between items-center py-1.5 border-b last:border-0"
                    style={{ borderColor: "var(--warm-gray)" }}>
                    <dt style={{ color: "var(--text-muted)" }}>{item!.label}</dt>
                    <dd className="font-medium" style={{ color: "var(--navy)" }}>{item!.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1">
                  <dt style={{ color: "var(--text-muted)" }}>Status</dt>
                  <dd>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Funder link */}
            <Link href={`/funders/${grant.funderId}`}
              className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm animate-slide-up"
              style={{ background: "white", borderColor: "var(--border)", animationDelay: "180ms" }}>
              <span className="text-sm font-medium" style={{ color: "var(--navy)" }}>View funder requirements</span>
              <ExternalLink className="h-4 w-4" style={{ color: "var(--gold)" }} />
            </Link>

            {/* Submit section */}
            <div className="animate-slide-up" style={{ animationDelay: "240ms" }}>
              <SubmitSection
                grantId={grantId}
                grantTitle={grant.title}
                status={grant.status}
                deadline={grant.deadline?.toISOString() ?? null}
                complianceScore={grant.complianceScore}
                sections={grant.sections.map((s) => ({
                  label: s.label,
                  isComplete: s.isComplete,
                  isRequired: grant.funder.sections.find((f) => f.sectionKey === s.sectionKey)?.isRequired ?? true,
                }))}
                funderName={grant.funder.name}
                funderWebsite={grant.funder.website ?? null}
                submittedAt={grant.submittedAt?.toISOString() ?? null}
                submissionPortal={grant.submissionPortal ?? null}
                submissionMethod={grant.submissionMethod ?? null}
                submissionReference={grant.submissionReference ?? null}
                submissionNotes={grant.submissionNotes ?? null}
                followUpDate={grant.followUpDate?.toISOString() ?? null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
