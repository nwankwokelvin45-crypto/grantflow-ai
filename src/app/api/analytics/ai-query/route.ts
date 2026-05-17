import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const orgId = membership.organizationId;

  // Fetch summary data
  const grants = await prisma.grant.findMany({
    where: { organizationId: orgId },
    include: {
      funder: { select: { name: true, province: true } },
      compliance: { orderBy: { checkedAt: "desc" }, take: 1 },
    },
  });

  const summary = {
    totalGrants: grants.length,
    byStatus: grants.reduce((acc, g) => { acc[g.status] = (acc[g.status] ?? 0) + 1; return acc; }, {} as Record<string, number>),
    totalRequested: grants.reduce((s, g) => s + Number(g.requestedAmount || 0), 0),
    awarded: grants.filter(g => g.status === "AWARDED").length,
    avgCompliance: grants.flatMap(g => g.compliance.map(c => c.score)).reduce((s, v, _, a) => s + v / a.length, 0) || null,
    topFunders: Object.entries(grants.reduce((acc, g) => { acc[g.funder.name] = (acc[g.funder.name] ?? 0) + 1; return acc; }, {} as Record<string, number>))
      .sort((a, b) => b[1] - a[1]).slice(0, 5),
    recentGrants: grants.slice(0, 5).map(g => ({ title: g.title, status: g.status, funder: g.funder.name })),
  };

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You are an analytics assistant for a nonprofit grant management platform.
Answer questions about the organization's grant portfolio in 2-3 sentences. Be specific with numbers.
If the answer isn't in the data, say so honestly. Do not use markdown or lists — plain sentences only.`,
      },
      {
        role: "user",
        content: `Organization: ${membership.organization.name}\nData: ${JSON.stringify(summary)}\n\nQuestion: ${question}`,
      },
    ],
  });

  return NextResponse.json({ answer: completion.choices[0]?.message?.content ?? "Unable to answer." });
}
