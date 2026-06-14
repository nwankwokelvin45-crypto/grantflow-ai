import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { buildGrantWriterMessages } from "@/services/ai/grantWriter";
import { checkAiLimit, incrementAiUsage } from "@/lib/billing";
import { aiLimiter } from "@/lib/ratelimit";
import { z } from "zod";

const generateSchema = z.object({
  grantId: z.string(),
  sectionKey: z.string(),
  tone: z.enum(["professional", "warm", "formal"]).default("professional"),
  wordTarget: z.number().min(50).max(1000).default(300),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const rl = aiLimiter(userId);
  if (!rl.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { grantId, sectionKey, tone, wordTarget } = parsed.data;

  // Load grant with org + funder context
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    include: {
      organization: true,
      funder: {
        include: {
          sections: { where: { sectionKey } },
          rules: { where: { isActive: true } },
        },
      },
      sections: true,
    },
  });

  if (!grant) {
    return Response.json({ error: "Grant not found" }, { status: 404 });
  }

  // Verify access
  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: grant.organizationId,
      },
    },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Check AI usage limit
  const usage = await checkAiLimit(session.user.id);
  if (!usage.allowed) {
    return Response.json({
      error: "ai_limit_reached",
      message: `You've used all ${usage.limit} AI generations this month. Upgrade to get more.`,
      used: usage.used,
      limit: usage.limit,
      tier: usage.tier,
    }, { status: 402 });
  }

  // Load any uploaded funder requirements for this funder (most recent analyzed one)
  const funderReq = await prisma.funderRequirement.findFirst({
    where: {
      organizationId: grant.organizationId,
      funderName: { equals: grant.funder.name, mode: "insensitive" },
      analyzed: true,
    },
    orderBy: { analyzedAt: "desc" },
  });

  const messages = buildGrantWriterMessages({
    grant,
    sectionKey,
    tone,
    wordTarget,
    funderRequirements: funderReq ? {
      summary: funderReq.aiSummary,
      keyRequirements: (funderReq.keyRequirements as string[]) ?? [],
      fundingPriorities: (funderReq.fundingPriorities as string[]) ?? [],
      requiredSections: (funderReq.requiredSections as Array<{ name: string; wordLimit?: number | null; notes?: string }>) ?? [],
      importantNotes: (funderReq.importantNotes as string[]) ?? [],
    } : null,
  });

  let stream: Awaited<ReturnType<typeof openai.chat.completions.create>>;
  try {
    stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      stream: true,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    });
  } catch (err: unknown) {
    console.error("[ai/generate] OpenAI error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("401") || msg.includes("Incorrect API key") || msg.includes("invalid_api_key")) {
      return Response.json({ error: "Invalid OpenAI API key. Check your OPENAI_API_KEY environment variable." }, { status: 502 });
    }
    if (msg.includes("429") || msg.includes("quota")) {
      return Response.json({ error: "OpenAI quota exceeded or rate limit reached. Check your OpenAI account billing." }, { status: 502 });
    }
    if (msg.includes("model") || msg.includes("404")) {
      return Response.json({ error: `Model "${OPENAI_MODEL}" not found. Your API key may not have access to gpt-4o.` }, { status: 502 });
    }
    return Response.json({ error: `OpenAI error: ${msg}` }, { status: 502 });
  }

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          if (fullText) {
            const { countWords } = await import("@/lib/utils");
            await incrementAiUsage(userId);
            await prisma.grantSection.update({
              where: { grantId_sectionKey: { grantId, sectionKey } },
              data: {
                content: fullText,
                wordCount: countWords(fullText),
                aiGenerated: true,
                isComplete: true,
              },
            });
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("Streaming error:", err);
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}
