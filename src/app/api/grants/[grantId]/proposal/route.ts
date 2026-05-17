import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

async function getGrant(grantId: string, userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return null;
  return prisma.grant.findFirst({
    where: { id: grantId, organizationId: membership.organizationId },
    include: {
      funder: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          rules: { where: { isActive: true } },
        },
      },
      organization: true,
      documents: { include: { document: { select: { name: true, category: true } } } },
    },
  });
}

function buildOrgContext(grant: NonNullable<Awaited<ReturnType<typeof getGrant>>>) {
  const org = grant.organization;
  const funder = grant.funder;
  const attachedDocs = grant.documents?.map(d => `${d.document.name} (${d.document.category.replace(/_/g, " ").toLowerCase()})`).join(", ") || "None";
  return `
Organization: ${org.name}
Type: ${org.registrationType}
Province: ${org.province}
Mission: ${org.missionStatement ?? "Not provided"}
Program description: ${org.programDescription ?? "Not provided"}
Annual budget: ${org.annualBudget ? `$${org.annualBudget}` : "Not provided"}
Staff: ${org.staffCount ?? "Not provided"} | Volunteers: ${org.volunteerCount ?? "Not provided"}
Founded: ${org.foundedYear ?? "Not provided"}
Focus area: ${org.primaryFocusArea ?? "General"}

Grant title: ${grant.title}
Funder: ${funder.name} (${funder.province})
Focus areas: ${funder.focusAreas.join(", ") || "General"}
Funding types: ${funder.fundingTypes.join(", ") || "General"}
Grant amount requested: ${grant.requestedAmount ? `$${grant.requestedAmount}` : "Not specified"}
Required sections: ${funder.sections.map(s => s.label).join(", ") || "General narrative"}
Supporting documents attached: ${attachedDocs}
`.trim();
}

// POST /api/grants/[grantId]/proposal — generate questions (+ optionally answers)
export async function POST(req: NextRequest, { params }: { params: Promise<{ grantId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await getGrant(grantId, session.user.id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ctx = buildOrgContext(grant);

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert grant writer helping Canadian nonprofits prepare compelling, authentic grant proposals.

Generate 12–16 questions the funder will likely ask, AND a draft answer for each grounded entirely in the organization's specific details.

Rules for every answer:
- Use the org's ACTUAL name, mission, programs, numbers, geography, and founding year — never invent facts
- Write in a direct, confident first-person voice ("We operate...", "Our program serves...", "Since ${new Date().getFullYear() - 5}...")
- Be concrete: cite real figures (budget, staff count, beneficiaries) from the context provided
- NEVER use these overused grant phrases: "passionate about", "make a difference", "change lives", "holistic approach", "at-risk youth", "wrap-around services", "move the needle", "impactful", "synergy"
- Vary sentence structure — avoid starting consecutive sentences with "We"
- Each answer must be meaningfully different from what any other organization could submit
- Do not use placeholders like [X], [describe], or [insert]

Group into: Organization Background, Project Description, Budget & Financials, Impact & Outcomes, Sustainability.
Return a JSON array: { "category": string, "question": string, "hint": string, "answer": string }
- "hint": one-sentence tip specific to this funder's priorities
Return ONLY the JSON array, no markdown.`,
        },
        {
          role: "user",
          content: ctx,
        },
      ],
    });
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 401) return NextResponse.json({ error: "Invalid OpenAI API key." }, { status: 502 });
    if (e?.status === 429) return NextResponse.json({ error: "OpenAI quota exceeded." }, { status: 502 });
    return NextResponse.json({ error: "AI service unavailable." }, { status: 502 });
  }

  const content = completion.choices[0]?.message?.content ?? "[]";
  let questions: { category: string; question: string; hint: string; answer: string }[] = [];
  try {
    questions = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
  }

  return NextResponse.json({ questions });
}

// PATCH /api/grants/[grantId]/proposal — generate answers for specific questions
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ grantId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await getGrant(grantId, session.user.id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { questions } = await req.json() as {
    questions: { id: string; question: string; category: string }[];
  };

  if (!questions?.length) return NextResponse.json({ error: "No questions provided" }, { status: 400 });

  const ctx = buildOrgContext(grant);
  const questionList = questions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}`).join("\n");

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert grant writer. Generate draft answers to the provided grant application questions.

Rules for every answer:
- Ground every sentence in the organization's ACTUAL details from the context — name, mission, programs, numbers, geography
- Write in confident first-person ("We deliver...", "Our team of X staff...", "Since founding in [year]...")
- Be concrete: use real figures from the context (budget, staff, volunteers, focus area)
- NEVER use these clichés: "passionate about", "make a difference", "change lives", "holistic", "at-risk", "wrap-around", "impactful", "synergy", "leverage"
- Each answer must be specific enough that it could only have been written by THIS organization
- Do not invent statistics or programs not mentioned in the context
- Do not use placeholders like [X], [describe], or [insert]
- Vary sentence length and structure for a natural, human voice

Return a JSON array: { "id": string, "answer": string } — one entry per question in the same order.
Return ONLY the JSON array, no markdown.`,
        },
        {
          role: "user",
          content: `${ctx}\n\nQuestions to answer:\n${questionList}\n\nQuestion IDs in order: ${questions.map(q => q.id).join(", ")}`,
        },
      ],
    });
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 401) return NextResponse.json({ error: "Invalid OpenAI API key." }, { status: 502 });
    if (e?.status === 429) return NextResponse.json({ error: "OpenAI quota exceeded." }, { status: 502 });
    return NextResponse.json({ error: "AI service unavailable." }, { status: 502 });
  }

  const content = completion.choices[0]?.message?.content ?? "[]";
  let answers: { id: string; answer: string }[] = [];
  try {
    answers = JSON.parse(content);
    // Fallback: if AI returned answers without IDs, zip by index
    if (answers.length && !answers[0].id) {
      answers = answers.map((a, i) => ({ id: questions[i]?.id ?? `q-${i}`, answer: (a as unknown as { answer: string }).answer }));
    }
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
  }

  return NextResponse.json({ answers });
}
