import { auth } from "@/lib/auth";
import { openai, OPENAI_MODEL } from "@/lib/openai";

const SYSTEM_PROMPT = `You are Grant Assistant, an expert AI built into Grant2Fund'n — a grant writing platform for nonprofits in British Columbia and Alberta, Canada.

You help nonprofit staff:
- Find suitable funders and grants in BC and Alberta
- Understand grant requirements and eligibility
- Write compelling grant narratives and sections
- Improve compliance scores and meet funder guidelines
- Understand deadlines, submission processes, and follow-up strategies
- Navigate the Canadian nonprofit funding landscape

Keep responses concise, practical, and focused on grant writing and nonprofit funding. When relevant, reference BC/Alberta-specific funders like Vancouver Foundation, BC Arts Council, Alberta Foundation for the Arts, Calgary Foundation, etc.

If asked about something unrelated to grants or nonprofits, politely redirect to grant-related topics.`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      stream: true,
      temperature: 0.6,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-10), // keep last 10 messages for context
      ],
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
    );
  } catch (err) {
    console.error("[ai/chat]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
