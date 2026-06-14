import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, OPENAI_MODEL } from "@/lib/openai";

const EXTRACT_SYSTEM = `You are an expert Canadian nonprofit grant analyst.
Given raw text from a funder's guidelines or requirements document, extract the key information a grant writer needs.
Return ONLY valid JSON — no markdown, no code fences, no commentary.`;

const DRAFT_SYSTEM = `You are an expert Canadian nonprofit grant writer specializing in BC and Alberta.
Given a nonprofit organization's profile and a funder's specific questions/required sections,
write compelling, specific draft answers tailored to each question.
Use the organization's mission, programs, and context throughout.
Return ONLY valid JSON — no markdown, no code fences, no commentary.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { requirementId } = await req.json();
  if (!requirementId) return Response.json({ error: "requirementId required" }, { status: 400 });

  const requirement = await prisma.funderRequirement.findUnique({
    where: { id: requirementId },
    include: {
      organization: {
        select: {
          name: true,
          legalName: true,
          registrationType: true,
          province: true,
          city: true,
          missionStatement: true,
          programDescription: true,
          annualBudget: true,
          staffCount: true,
          volunteerCount: true,
          foundedYear: true,
          primaryFocusArea: true,
        },
      },
    },
  });

  if (!requirement) return Response.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: requirement.organizationId } },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  const org = requirement.organization;

  // Step 1: Extract requirements structure
  const extractPrompt = `Funder: ${requirement.funderName}

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
  "importantNotes": ["deadlines, budget limits, restrictions, or other critical notes"],
  "specificQuestions": [{"question": "exact question text the funder is asking", "notes": "any guidance on answering it", "wordLimit": number_or_null}]
}`;

  type Extracted = {
    summary?: string;
    keyRequirements?: string[];
    eligibilityCriteria?: string[];
    fundingPriorities?: string[];
    requiredSections?: Array<{ name: string; wordLimit?: number | null; notes?: string }>;
    importantNotes?: string[];
    specificQuestions?: Array<{ question: string; notes?: string; wordLimit?: number | null }>;
  };

  let extracted: Extracted = {};

  try {
    const extractRes = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content: extractPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });
    extracted = JSON.parse(extractRes.choices[0]?.message?.content ?? "{}");
  } catch (err) {
    console.error("[analyze-requirements] extraction failed", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }

  // Step 2: Generate draft answers using org profile
  const orgProfile = [
    `Organization: ${org.name}${org.legalName ? ` (Legal: ${org.legalName})` : ""}`,
    `Type: ${org.registrationType} | Province: ${org.province}${org.city ? `, ${org.city}` : ""}`,
    org.foundedYear ? `Founded: ${org.foundedYear}` : null,
    org.staffCount != null ? `Staff: ${org.staffCount}${org.volunteerCount != null ? ` | Volunteers: ${org.volunteerCount}` : ""}` : null,
    org.annualBudget ? `Annual Budget: $${Number(org.annualBudget).toLocaleString()}` : null,
    org.primaryFocusArea ? `Focus Area: ${org.primaryFocusArea}` : null,
    `Mission: ${org.missionStatement ?? "Not provided"}`,
    `Programs: ${org.programDescription ?? "Not provided"}`,
  ].filter(Boolean).join("\n");

  // Combine required sections + specific questions, deduplicating
  const sectionsToAnswer: Array<{ label: string; notes?: string; wordLimit?: number | null }> = [];

  for (const s of extracted.requiredSections ?? []) {
    sectionsToAnswer.push({ label: s.name, notes: s.notes, wordLimit: s.wordLimit });
  }
  for (const q of extracted.specificQuestions ?? []) {
    if (!sectionsToAnswer.find((s) => s.label.toLowerCase() === q.question.toLowerCase())) {
      sectionsToAnswer.push({ label: q.question, notes: q.notes, wordLimit: q.wordLimit });
    }
  }

  let draftAnswers: Array<{ question: string; answer: string; wordLimit?: number | null }> = [];

  if (sectionsToAnswer.length > 0) {
    const draftPrompt = `You are writing a grant application to ${requirement.funderName}.

ORGANIZATION PROFILE:
${orgProfile}

FUNDER SUMMARY: ${extracted.summary ?? ""}
FUNDER PRIORITIES: ${(extracted.fundingPriorities ?? []).join(", ")}
KEY REQUIREMENTS: ${(extracted.keyRequirements ?? []).join("; ")}
${extracted.importantNotes?.length ? `IMPORTANT NOTES: ${extracted.importantNotes.join("; ")}` : ""}

Write a compelling draft answer for each required section/question below.
Be specific — use concrete numbers, named programs, measurable outcomes. Tailor every answer to this funder's priorities.

Sections to answer:
${sectionsToAnswer.map((s, i) => `${i + 1}. "${s.label}"${s.wordLimit ? ` (max ${s.wordLimit} words)` : ""}${s.notes ? ` — ${s.notes}` : ""}`).join("\n")}

Return this JSON:
{
  "answers": [
    {
      "question": "exact section/question name",
      "answer": "your draft answer",
      "wordLimit": number_or_null
    }
  ]
}`;

    try {
      const draftRes = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: DRAFT_SYSTEM },
          { role: "user", content: draftPrompt },
        ],
        temperature: 0.6,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(draftRes.choices[0]?.message?.content ?? "{}");
      draftAnswers = Array.isArray(parsed.answers) ? parsed.answers : [];
    } catch (err) {
      console.error("[analyze-requirements] draft generation failed", err);
      // Non-fatal — save analysis without drafts
    }
  }

  const updated = await prisma.funderRequirement.update({
    where: { id: requirementId },
    data: {
      aiSummary: extracted.summary ?? null,
      keyRequirements: extracted.keyRequirements ?? [],
      eligibilityCriteria: extracted.eligibilityCriteria ?? [],
      fundingPriorities: extracted.fundingPriorities ?? [],
      requiredSections: extracted.requiredSections ?? [],
      importantNotes: extracted.importantNotes ?? [],
      draftAnswers: draftAnswers.length > 0 ? draftAnswers : [],
      analyzed: true,
      analyzedAt: new Date(),
    },
  });

  return Response.json(updated);
}
