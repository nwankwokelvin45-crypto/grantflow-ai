import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const org = membership.organization;

  const funders = await prisma.funder.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, focusAreas: true, province: true,
      minGrantAmount: true, maxGrantAmount: true, description: true,
      eligibleOrgTypes: true, fundingTypes: true,
    },
  });

  const orgProfile = `
Organization: ${org.name}
Province: ${org.province}
Type: ${org.registrationType}
Focus: ${org.primaryFocusArea ?? "General"}
Mission: ${org.missionStatement ?? "Not provided"}
Annual Budget: ${org.annualBudget ? `$${org.annualBudget}` : "Not provided"}
`;

  const fundersJson = funders.map(f => ({
    id: f.id,
    name: f.name,
    province: f.province,
    focusAreas: f.focusAreas,
    eligibleOrgTypes: f.eligibleOrgTypes,
    fundingTypes: f.fundingTypes,
    range: f.minGrantAmount && f.maxGrantAmount
      ? `$${f.minGrantAmount}–$${f.maxGrantAmount}`
      : "Varies",
  }));

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a grant matching expert. Given an organization profile and a list of funders, return a JSON array of match scores.
For each funder return: { "id": string, "score": number (0-100), "reason": string (1 sentence), "likelihood": "high"|"medium"|"low" }
Score based on: province match, focus area alignment, org type eligibility, budget fit.
Return only the JSON array, no markdown.`,
      },
      {
        role: "user",
        content: `Organization:\n${orgProfile}\n\nFunders:\n${JSON.stringify(fundersJson)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "[]";
  let matches: { id: string; score: number; reason: string; likelihood: string }[] = [];
  try {
    matches = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
  }

  return NextResponse.json(matches);
}
