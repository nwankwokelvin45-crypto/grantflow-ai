import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, OPENAI_MODEL } from "@/lib/openai";

const SYSTEM = `You are an expert Canadian nonprofit grant analyst.
Given raw text from a funder's guidelines or requirements document, extract the key information a grant writer needs.
Return ONLY valid JSON — no markdown, no code fences, no commentary.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { requirementId } = await req.json();
  if (!requirementId) return Response.json({ error: "requirementId required" }, { status: 400 });

  const requirement = await prisma.funderRequirement.findUnique({ where: { id: requirementId } });
  if (!requirement) return Response.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: requirement.organizationId } },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  const userPrompt = `Funder: ${requirement.funderName}

--- FUNDER REQUIREMENTS TEXT ---
${requirement.rawText.slice(0, 6000)}
--- END ---

Extract and return this JSON object:
{
  "summary": "2-3 sentence overview of what this funder funds and their main criteria",
  "keyRequirements": ["list of the most important requirements applicants must meet"],
  "eligibilityCriteria": ["who is eligible to apply"],
  "fundingPriorities": ["what topics/areas this funder prioritizes"],
  "requiredSections": [{"name": "section name", "wordLimit": number_or_null, "notes": "any specific instructions"}],
  "importantNotes": ["deadlines, budget limits, restrictions, or other critical notes"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const updated = await prisma.funderRequirement.update({
      where: { id: requirementId },
      data: {
        aiSummary: parsed.summary ?? null,
        keyRequirements: parsed.keyRequirements ?? [],
        eligibilityCriteria: parsed.eligibilityCriteria ?? [],
        fundingPriorities: parsed.fundingPriorities ?? [],
        requiredSections: parsed.requiredSections ?? [],
        importantNotes: parsed.importantNotes ?? [],
        analyzed: true,
        analyzedAt: new Date(),
      },
    });

    return Response.json(updated);
  } catch (err) {
    console.error("[analyze-requirements]", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
