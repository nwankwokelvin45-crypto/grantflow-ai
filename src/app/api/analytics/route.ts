import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const orgId = membership.organizationId;

  const [grants, sections, submissions, reviews] = await Promise.all([
    prisma.grant.findMany({
      where: { organizationId: orgId },
      include: {
        funder: { select: { name: true } },
        compliance: { orderBy: { checkedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.grantSection.findMany({
      where: { grant: { organizationId: orgId } },
      select: { aiGenerated: true, isComplete: true },
    }),
    prisma.formSubmission.findMany({
      where: { form: { orgId } },
      select: { status: true, submittedAt: true },
    }),
    prisma.reviewScore.findMany({
      where: { assignment: { grant: { organizationId: orgId } } },
      select: { totalScore: true, submittedAt: true },
    }),
  ]);

  // Grant status breakdown
  const byStatus: Record<string, number> = {};
  for (const g of grants) {
    byStatus[g.status] = (byStatus[g.status] ?? 0) + 1;
  }

  // Funder breakdown (top funders by grant count)
  const byFunder: Record<string, number> = {};
  for (const g of grants) {
    const name = g.funder.name;
    byFunder[name] = (byFunder[name] ?? 0) + 1;
  }
  const topFunders = Object.entries(byFunder)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Monthly grant activity (last 6 months)
  const now = new Date();
  const months: { label: string; created: number; submitted: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-CA", { month: "short" });
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    months.push({
      label,
      created: grants.filter(g => new Date(g.createdAt) >= d && new Date(g.createdAt) < next).length,
      submitted: grants.filter(g => g.submittedAt && new Date(g.submittedAt) >= d && new Date(g.submittedAt) < next).length,
    });
  }

  // Success metrics
  const awarded = grants.filter(g => g.status === "AWARDED").length;
  const submitted = grants.filter(g => ["SUBMITTED", "AWARDED", "DECLINED"].includes(g.status)).length;
  const successRate = submitted > 0 ? Math.round((awarded / submitted) * 100) : null;

  // Total requested
  const totalRequested = grants.reduce((s, g) => s + (Number(g.requestedAmount) || 0), 0);
  const totalAwarded = grants
    .filter(g => g.status === "AWARDED")
    .reduce((s, g) => s + (Number(g.requestedAmount) || 0), 0);

  // Avg compliance score
  const scores = grants.flatMap(g => g.compliance.map(c => c.score));
  const avgCompliance = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

  // AI usage
  const aiSections = sections.filter(s => s.aiGenerated).length;
  const totalSections = sections.length;

  // Submission pipeline
  const submissionByStatus: Record<string, number> = {};
  for (const s of submissions) {
    submissionByStatus[s.status] = (submissionByStatus[s.status] ?? 0) + 1;
  }

  // Avg review score
  const avgReview = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.totalScore, 0) / reviews.length)
    : null;

  return NextResponse.json({
    summary: {
      totalGrants: grants.length,
      successRate,
      totalRequested,
      totalAwarded,
      avgCompliance,
      aiUsageRate: totalSections > 0 ? Math.round((aiSections / totalSections) * 100) : 0,
      avgReviewScore: avgReview,
      formSubmissions: submissions.length,
    },
    byStatus,
    topFunders,
    monthlyActivity: months,
    submissionByStatus,
  });
}
